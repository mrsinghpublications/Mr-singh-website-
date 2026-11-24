/**
 * Mr Singh Publications — Cashfree Dynamic Payment Links (Firebase Cloud Function)
 * =================================================================================
 * Function: createCashfreeLink (callable, region asia-south1)
 *
 * Frontend se bookId + optional couponCode aata hai. Ye function:
 *   1. Book ki price Firestore se leta hai (server source of truth — client
 *      jo price bheje us par bharosa nahi kiya jata).
 *   2. User ke pehle ke orders gin kar bulk discount lagata hai
 *      (2nd book X%, 3rd book Y% — Admin Tab 5 ke bulk settings se).
 *   3. Coupon code Firestore `coupons` collection se validate karta hai
 *      (active / expiry / maxUses / minAmount / minBooks).
 *   4. Final amount par Cashfree Payment Links API se ek FRESH dynamic link
 *      banata hai (har order ke liye alag link_id).
 *   5. Firestore `orders` me ek pending order likhta hai, taaki payment ke
 *      baad return par store use confirm kar sake.
 *   6. { link_url, order_id, amount } wapas bhejta hai — frontend user ko
 *      Cashfree ke secure page par redirect kar deta hai.
 *
 * SECURITY: Cashfree Secret Key yahan code me NAHI hai. Wo Firebase Secret
 * Manager me hai (CASHFREE_CLIENT_SECRET) aur sirf server par milti hai.
 * Client ID (App ID) public hai — wo Firestore config/settings se liya jata hai.
 *
 * IMPORTANT — Blaze plan: Spark (free) plan par Cloud Function sirf Google
 * services ko call kar sakta hai. Cashfree (non-Google) ko call karne ke liye
 * Firebase project ko Blaze (pay-as-you-go) par upgrade karna ZAROORI hai.
 * Bina Blaze ke ye function deploy ho jayega par Cashfree call fail hogi.
 * Deploy steps: functions/DEPLOY_GUIDE.md dekhein.
 */

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret, defineString} = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Secret Manager secrets (deploy se pehle set karein — DEPLOY_GUIDE.md):
//   firebase functions:secrets:set CASHFREE_CLIENT_SECRET
const CASHFREE_CLIENT_SECRET = defineSecret("CASHFREE_CLIENT_SECRET");
// "live" (asli payments) ya "sandbox" (test payments). Default: live.
const CASHFREE_ENV = defineString("CASHFREE_ENV", {default: "live"});

const STORE_URL = "https://mrsinghpublications.isroot.in";

function cfBase(env) {
  return env === "sandbox" ? "https://sandbox.cashfree.com" : "https://api.cashfree.com";
}

// v19.5.2: har Firestore read par timeout — 24 Nov 15:49 IST ko ek read bina
// jawab ke atak gaya tha (na error, na timeout line), isliye ab atakne par
// saaf error milta hai aur client latka nahi rehta.
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timed out: " + label)), ms)),
  ]);
}

exports.createCashfreeLink = onCall(
  {
    region: "asia-south1",
    secrets: [CASHFREE_CLIENT_SECRET],
    cors: true,
  },
  async (request) => {
    // 0. Login zaroori hai (store par bina login ke buy nahi hota).
    const uid = request.auth && request.auth.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Please login first.");
    }
    const data = request.data || {};
    const bookId = String(data.bookId || "").trim();
    const couponCode = String(data.couponCode || "").trim().toUpperCase();
    if (!bookId) {
      throw new HttpsError("invalid-argument", "bookId is required.");
    }
    // v19.5.1: step logging — 24 Nov ko call verification ke baad handler
    // chup ho gaya tha (na error, na Cashfree call, na timeout line), isliye
    // har step log hota hai taaki atakne ki jagah dikhe.
    console.log("createCashfreeLink: auth ok uid=" + uid + " bookId=" + bookId + " coupon=" + couponCode);

    // 1. Book — price + live status Firestore se (server source of truth).
    const bookSnap = await db.collection("books").doc(bookId).get();
    if (!bookSnap.exists) {
      throw new HttpsError("not-found", "Book not found.");
    }
    const book = bookSnap.data();
    if (book.status !== "live") {
      throw new HttpsError("failed-precondition", "This book is not live yet.");
    }
    const base = Number(book.price || 0);
    if (!(base >= 0)) {
      throw new HttpsError("invalid-argument", "Invalid book price.");
    }
    console.log("createCashfreeLink: book ok price=" + base);

    // 2. Bulk discount — user ke CONFIRMED orders gine jate hain.
    console.log("createCashfreeLink: reading orders for uid");
    const ordersSnap = await withTimeout(db.collection("orders").where("userId", "==", uid).get(), 10000, "orders query");
    console.log("createCashfreeLink: orders read, count=" + ordersSnap.size);
    let owned = 0;
    ordersSnap.forEach((d) => {
      const s = String((d.data() && d.data().status) || "");
      if (s.indexOf("confirmed") !== -1 || s.indexOf("Free eBook") === 0) owned += 1;
    });
    let bulk2Pct = 0;
    let bulk3Pct = 0;
    try {
      const cfgSnap = await withTimeout(db.collection("config").doc("settings").get(), 10000, "config read");
      const cfg = cfgSnap.exists ? cfgSnap.data() : {};
      bulk2Pct = Number(cfg.bulk2Pct || 0);
      bulk3Pct = Number(cfg.bulk3Pct || 0);
    } catch (e) { console.log("createCashfreeLink: config read failed: " + (e && e.message ? e.message : e)); }
    let bulkPct = 0;
    if (owned + 1 >= 3 && bulk3Pct > 0) bulkPct = bulk3Pct;
    else if (owned + 1 >= 2 && bulk2Pct > 0) bulkPct = bulk2Pct;
    const bulkAmt = Math.round((base * bulkPct) / 100);

    // 3. Coupon — Firestore `coupons` se validate (Admin Tab 5 ke coupons
    //    yahan sync hote hain; bina sync ke coupon "not found" aayega).
    let couponAmt = 0;
    let coupon = null;
    if (couponCode) {
      console.log("createCashfreeLink: reading coupon " + couponCode);
      const cSnap = await withTimeout(db.collection("coupons").doc(couponCode).get(), 10000, "coupon read");
      console.log("createCashfreeLink: coupon read exists=" + cSnap.exists);
      if (!cSnap.exists) {
        throw new HttpsError("not-found", "Coupon code not found.");
      }
      const c = cSnap.data();
      if (!c.active) {
        throw new HttpsError("failed-precondition", "This coupon is inactive.");
      }
      if (c.expiry && new Date(c.expiry) < new Date()) {
        throw new HttpsError("failed-precondition", "This coupon has expired.");
      }
      if (Number(c.maxUses) > 0 && Number(c.uses || 0) >= Number(c.maxUses)) {
        throw new HttpsError("failed-precondition", "This coupon has reached its usage limit.");
      }
      if (Number(c.minAmount) > 0 && base < Number(c.minAmount)) {
        throw new HttpsError("failed-precondition", "This coupon needs a minimum order of Rs " + c.minAmount + ".");
      }
      if (Number(c.minBooks) > 0 && owned + 1 < Number(c.minBooks)) {
        throw new HttpsError("failed-precondition", "This coupon applies after buying " + c.minBooks + " books.");
      }
      coupon = {code: c.code || couponCode, type: c.type, value: Number(c.value || 0)};
      couponAmt = c.type === "flat"
        ? Math.min(Number(c.value || 0), base - bulkAmt)
        : Math.round(((base - bulkAmt) * Number(c.value || 0)) / 100);
    }

    const amount = Math.max(0, base - bulkAmt - couponAmt);
    console.log("createCashfreeLink: amount=" + amount + " base=" + base + " bulk=" + bulkAmt + " coupon=" + couponAmt);
    if (amount === 0) {
      return {free: true, amount: 0, order_id: null, link_url: null};
    }

    // 4. Customer details (login token se, kami ho to frontend se).
    const auth = request.auth.token || {};
    const customer = (data.customer && typeof data.customer === "object") ? data.customer : {};
    const customerName = String(customer.name || auth.name || "Customer").slice(0, 100);
    const customerEmail = String(customer.email || auth.email || "").slice(0, 100);
    let customerPhone = String(customer.phone || auth.phone_number || "").replace(/\D/g, "").slice(-10);
    // v19.5.5: purane client phone nahi bhejte — profile (customers doc,
    // doc id = lowercase email) se phone lein, taaki purana app bhi chale.
    if (!customerPhone) {
      try {
        const emailKey = String(customerEmail || auth.email || "").toLowerCase().trim();
        if (emailKey) {
          const custSnap = await withTimeout(db.collection("customers").doc(emailKey).get(), 10000, "customers read");
          if (custSnap.exists) {
            const cd = custSnap.data() || {};
            customerPhone = String(cd.mobile || cd.phone || "").replace(/\D/g, "").slice(-10);
          }
        }
      } catch (e) { /* phone fallback optional hai — validation neeche handle karega */ }
    }
    // v19.5.5: Cashfree ko customer_phone chahiye — bina iske link nahi banta.
    // Pehle saaf error dein (Cashfree API error se pehle), taaki user ko
    // pata chale ki profile me mobile number add karna hai.
    if (!customerPhone || customerPhone.length < 10) {
      throw new HttpsError("failed-precondition", "Mobile number missing — please add your 10-digit mobile number in your profile before paying.");
    }

    // 5. Cashfree credentials — Secret Key sirf server par.
    const env = (CASHFREE_ENV.value() || "live").toLowerCase() === "sandbox" ? "sandbox" : "live";
    let clientId = "";
    try {
      const cfgSnap = await db.collection("config").doc("settings").get();
      clientId = String((cfgSnap.exists ? cfgSnap.data().cfAppId : "") || "").trim();
    } catch (e) { /* ignore */ }
    const clientSecret = (CASHFREE_CLIENT_SECRET.value() || "").trim();
    if (!clientId || !clientSecret) {
      throw new HttpsError(
        "failed-precondition",
        "Cashfree is not configured on the server yet (Client ID / Secret missing)."
      );
    }

    // 6. Dynamic payment link banayein (har order ke liye alag link_id).
    const orderId = "MSP-" + Date.now().toString(36).toUpperCase() + "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase();
    const returnUrl = STORE_URL + "/?cf_return=1&order_id=" + encodeURIComponent(orderId);
    const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    // v19.5.1: Cashfree fetch par 20s timeout — bina timeout ke ek atakna
    // (24 Nov) frontend ko hamesha ke liye latka deta tha; ab timeout par
    // saaf error milta hai aur user dobara try kar sakta hai.
    console.log("createCashfreeLink: calling Cashfree " + cfBase(env) + "/pg/links amount=" + amount);
    let resp;
    try {
      resp = await fetch(cfBase(env) + "/pg/links", {
        method: "POST",
        signal: AbortSignal.timeout(20000),
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "x-api-version": "2023-08-01",
        },
        body: JSON.stringify({
          link_id: orderId,
          link_amount: amount,
          link_currency: "INR",
          link_purpose: String(book.title || "eBook").slice(0, 100),
          customer_details: {
            customer_id: uid,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
          },
          link_notify: {send_sms: Boolean(customerPhone), send_email: Boolean(customerEmail)},
          link_meta: {return_url: returnUrl, notify_url: ""},
          link_expiry_time: expiry,
        }),
      });
    } catch (e) {
      console.error("createCashfreeLink: Cashfree fetch failed: " + (e && e.message ? e.message : e));
      throw new HttpsError("internal", "Cashfree se jawab nahi aaya — dobara try karein. (" + (e && e.name ? e.name : "fetch error") + ")");
    }
    console.log("createCashfreeLink: Cashfree status=" + resp.status);
    const resJson = await resp.json().catch(() => ({}));
    if (!resp.ok || !resJson.link_url) {
      const msg = (resJson && (resJson.message || resJson.error)) || ("Cashfree error " + resp.status);
      throw new HttpsError("internal", "Cashfree link nahi ban paya: " + String(msg).slice(0, 200));
    }

    // 7. Pending order likhein (return par confirm karne ke liye).
    await db.collection("orders").doc(orderId).set({
      id: orderId,
      userId: uid,
      bookId: book.id,
      title: book.title || "",
      price: amount,
      originalPrice: base,
      discountAmt: bulkAmt + couponAmt,
      bulkPct: bulkPct,
      couponCode: coupon ? coupon.code : "",
      method: "cashfree-link",
      status: "Payment link created — awaiting payment",
      link_url: resJson.link_url,
      date: new Date().toISOString(),
    });
    console.log("createCashfreeLink: order written " + orderId + " link ok");

    // 8. Coupon use gin lein (link banne ke baad hi).
    if (coupon) {
      try {
        await db.collection("coupons").doc(coupon.code)
          .update({uses: admin.firestore.FieldValue.increment(1)});
      } catch (e) { /* ignore */ }
    }

    return {link_url: resJson.link_url, order_id: orderId, amount: amount};
  }
);

/**
 * Push Broadcast (v19.3) — sendPushBroadcast (callable, region asia-south1)
 * =========================================================================
 * Admin (sirf publisher) title + body bhejta hai; ye function Firestore
 * `pushTokens` collection ke sabhi FCM tokens par notification bhejta hai
 * (admin.messaging().sendEachForMulticast). Invalid / unregistered tokens
 * collection se hata diye jate hain.
 *
 * FRONTEND: Admin → Notifications tab → Send. In-app notification hamesha
 * bhejti hai; ye function uske ALAWA phone par real push bhejta hai.
 *
 * BLAZE: FCM Google service hai, isliye ye function Spark (free) plan par bhi
 * chalna chahiye (Cashfree jaisa non-Google call nahi hai). Deploy karke test
 * karein; agar "outbound networking blocked" jaisi error aaye to Blaze check karein.
 *
 * Deploy: firebase deploy --only functions:sendPushBroadcast
 * (poora functions folder deploy karne ke liye: firebase deploy --only functions)
 */
const ADMIN_EMAIL = defineString("ADMIN_EMAIL", {default: "mrsinghpublications@gmail.com"});

exports.sendPushBroadcast = onCall(
  {
    region: "asia-south1",
    cors: true,
  },
  async (request) => {
    // 0. Sirf publisher (admin email) bhej sakta hai.
    const email = request.auth && request.auth.token && request.auth.token.email;
    if (!request.auth || !email || String(email).toLowerCase() !== ADMIN_EMAIL.value().toLowerCase()) {
      throw new HttpsError("permission-denied", "Only the publisher can send push notifications.");
    }
    const title = String((request.data && request.data.title) || "").trim();
    const body = String((request.data && request.data.body) || "").trim();
    if (!title) throw new HttpsError("invalid-argument", "Title is required.");
    if (title.length > 100 || body.length > 500) throw new HttpsError("invalid-argument", "Title/body too long.");

    // 1. Sabhi push tokens lao.
    const snap = await db.collection("pushTokens").get();
    const tokens = [];
    snap.forEach((d) => {
      const t = (d.data() && d.data().token) || d.id;
      if (t) tokens.push(String(t));
    });
    if (!tokens.length) return {sent: 0, failed: 0, total: 0};

    // 2. 500-token chunks me bhejo (FCM multicast limit).
    let sent = 0;
    let failed = 0;
    const dead = [];
    for (let i = 0; i < tokens.length; i += 500) {
      const chunk = tokens.slice(i, i + 500);
      const res = await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: {title, body},
        webpush: {
          notification: {title, body, icon: `${STORE_URL}/icon.jpg`},
          fcmOptions: {link: STORE_URL},
        },
      });
      sent += res.successCount;
      failed += res.failureCount;
      res.responses.forEach((r, j) => {
        if (!r.success) {
          const code = (r.error && r.error.code) || "";
          if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
            dead.push(chunk[j]);
          }
        }
      });
    }

    // 3. Dead tokens hata do (dobara fail na hon).
    if (dead.length) {
      const batch = db.batch();
      dead.forEach((t) => batch.delete(db.collection("pushTokens").doc(t)));
      await batch.commit().catch(() => {});
    }

    return {sent, failed, total: tokens.length};
  }
);
