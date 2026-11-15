# Mr Singh Publications — Setup Guide (Step by Step, Easy Way)

**Website:** https://mrsinghpublications.isroot.in
**Owner:** Dayashankar Singh (Mr Singh) — mrsinghpublications@gmail.com

Is guide me har cheez number-wise hai. Ek step poora karke agle par jayein. Koi step skip karne se uska feature kaam nahi karega — jaise Firebase bina login/OTP nahi chalega, payment link bina payment nahi chalega.

---

## Pehle ye taiyaar rakhein
- ZIP file: `mr-singh-publications-website.zip` (is guide ke saath wali)
- GitHub account + wahi repository jisme website live hai
- Razorpay account (payment ke liye) — https://razorpay.com
- Firebase account (Google login + OTP ke liye) — https://console.firebase.google.com
- EmailJS account (optional — automatic eBook email ke liye) — https://www.emailjs.com

---

## STEP 0 — Custom domain (isroot.in) GitHub se jodein (ek baar, 10 minute)

Aapka domain `mrsinghpublications.isroot.in` **isroot.in se liya hua custom domain** hai, aur website **GitHub Pages par hosted** hai. Dono ko jodne ke liye ye ek baar karna hai:

### A. isroot.in panel me DNS record dalen
1. isroot.in par login karein → **My Domains** → `isroot.in` wale domain par **Manage / DNS Management** kholein.
2. Ek **CNAME record** add karein:
   - **Host / Name:** `mrsinghpublications`
   - **Type:** CNAME
   - **Value / Points to:** `mrsinghpublications.github.io` (aapka GitHub username `mrsinghpublications` hai — https://github.com/mrsinghpublications)
   - **TTL:** 3600 (ya default)
3. Save karein. DNS ko poori duniya me failne me **10 minute se 24 ghante** lag sakte hain — aam taur par 30 minute me ho jata hai.

### B. GitHub repo me custom domain set karein
1. GitHub → apni website wali repository → **Settings → Pages**.
2. **Custom domain** wale box me likhein: `mrsinghpublications.isroot.in` → **Save**.
3. Thodi der baad **Enforce HTTPS** par tick lag jayega — use **ON** rakhein (site `https://` se khulni chahiye, warna Firebase login/OTP kaam nahi karega).
4. Agar GitHub "DNS check" me error dikhaye to matlab Step A ka record abhi faila nahi hai — thoda ruk kar dobara check karein.

> Note: agar aapki hosting isroot.in ke server par hai (GitHub Pages par nahi), to files GitHub ki jagah isroot.in ke **File Manager → public_html** folder me upload karni hongi. Upar wala Step 1 tab bhi same hai — bas jagah badal jayegi.

## STEP 1 — Nayi files GitHub par upload karein (5 minute)

1. ZIP ko computer par extract karein — andar 8 files milengi: `index.html`, `logo.png`, `icon.jpg`, `manifest.json`, `sw.js`, `README.md`, `SPEC.md`, `SETUP_GUIDE.md`.
2. GitHub kholein → apni website wali repository kholein.
3. **Add file → Upload files** par click karein.
4. Extract ki hui **saari 8 files ek saath drag karke** upload karein. Agar GitHub puche "Replace existing files?" to **Replace / Commit** karein.
5. Neeche **Commit changes** dabayein.
6. **1–2 minute ruken** — GitHub Pages ko deploy hone me time lagta hai.
7. Site kholein: https://mrsinghpublications.isroot.in
8. **Hard refresh karein:** PC par `Ctrl + Shift + R`, mobile par browser band karke dobara kholein. Purani file cache me rehti hai — bina hard refresh ke naya version nahi dikhega.

> Check: upar header me **My Library** button aur bell (🔔) dikhna chahiye. Dikh raha hai to v8 live hai.

---

## STEP 2 — Admin login karein aur password badlein (2 minute)

1. Site par **Admin Panel** button dabayein.
2. Password dalen: `admin123` (pehli baar ka default password).
3. Admin khulne ke baad **Tab 3 (Payment & Firebase)** me jayein → neeche **Change Password** se apna naya password set karein. `admin123` waisa hi chhodna safe nahi hai.
4. Wahi Tab 3 me **Admin Email** check karein — `mrsinghpublications@gmail.com` hona chahiye. Yahi email Google Admin Login ke liye use hota hai.

---

## STEP 3 — Payment setup karein (10 minute)

Admin → **Tab 3**. Aapke paas 2 tareeke hain — jo aasan lage, wahi karein. Dono optional hain, par bina inme se ek ke bhi customer pay nahi kar payega.

### Option A — Razorpay Key ID (recommended, in-app checkout)
1. https://dashboard.razorpay.com kholein → login karein.
2. **Settings → API Keys** → **Key ID** copy karein (ye `rzp_live_...` se shuru hota hai).
3. Site ke Admin Tab 3 → **Razorpay Key ID** wale box me paste karein.
4. **Active Payment Gateway** me **Razorpay** select karein.
5. **Save** dabayein.
6. Ab customer site chhode bina UPI / Card se pay kar payega.

> Test karne ke liye pehle **Test Mode** key (`rzp_test_...`) use kar sakte hain. Live payment ke liye `rzp_live_...` key dalen.

### Option B — Payment Link (Cashfree / Razorpay link)
1. Cashfree ya Razorpay dashboard se apni **Payment Link** banayein (jaise `https://payments.cashfree.com/...` ya `https://rzp.io/...`).
2. Admin Tab 3 → **Default Payment Link** me paste karein → Save.
3. Ab customer ko payment page naye tab me khulega.

### Cashfree App ID
- Cashfree Dashboard → Developers → API Keys → **App ID** copy karke Tab 3 ke **Cashfree App ID** box me dalen.
- Sirf App ID se checkout nahi khulta — Cashfree ke liye payment link hi use hoga.

### ⚠️ Secret Key kabhi na dalen
- Razorpay / Cashfree ki **Secret Key** is file me kahin nahi dalni hai. Ye file sabke browser me khulti hai — secret key wahan daalne se koi bhi use dekh lega.
- Sirf **Key ID / App ID** (public wali) dalni hai.

---

## STEP 4 — Firebase setup karein (Google login + Phone OTP) (15 minute)

Ye step **zaroori** hai — bina iske Gmail login aur OTP nahi chalega. Demo Mode me OTP screen par hi dikh jata hai, real OTP ke liye ye karna hi padega.

### 4A. Firebase project banayein
1. https://console.firebase.google.com kholein → **Add project** → naam likhein (jaise `mr-singh-publications`) → Continue → Google Analytics band karke bhi chalega → **Create project**.
2. Project khulne ke baad **Build → Authentication** → **Get started** dabayein.

### 4B. Google aur Phone ON karein (sabse important)
1. Authentication → **Sign-in method** tab kholein.
2. **Google** par click karein → **Enable** karein → Support email me `mrsinghpublications@gmail.com` select karein → **Save**.
3. **Phone** par click karein → **Enable** karein → **Save**.
4. Agar ye dono Enable nahi hain to Gmail login aur OTP kabhi nahi aayega — ye sabse common galti hai.

### 4C. Apni domain authorize karein
1. Authentication → **Settings** tab → **Authorized domains** section.
2. **Add domain** dabayein → `mrsinghpublications.isroot.in` likhein → Add.
3. (Test ke liye `localhost` pehle se hota hai, use chhod dein.)

### 4D. Config copy karke site me paste karein
1. Firebase Console → **Project Settings** (⚙️ icon, upar left) → **Your apps** → **Web app (</>)** → **Register app** → naam likhein → **Register**.
2. Wahan dikh raha **firebaseConfig** object (jo `{ "apiKey": "...", "authDomain": "...", ... }` jaisa dikhta hai) poora copy karein.
3. Apni site → Admin → **Tab 3** → **Firebase Auth Setup** wale box me paste karein → **Save**.
4. **Test Firebase Connection** dabayein — "connected" aana chahiye.
5. **Diagnose Login / OTP** dabayein — wo batayega ki sab sahi hai ya kya kami hai.

### 4E. Push notifications ke liye VAPID key (optional, baad me bhi chalega)
1. Firebase Console → Project Settings → **Cloud Messaging** tab → **Web Push certificates** → **Generate key pair**.
2. Jo key bane, use copy karke Admin → **Tab 6 (Notifications)** → **VAPID Key** box me dalen → Save.

---

## STEP 5 — EmailJS setup karein (optional, 10 minute)

Bina EmailJS ke bhi site chalegi — customer ko eBook turant download mil jayega, aur email ke liye uske email app me pre-filled mail khul jayega. Automatic email chahiye to ye karein:

1. https://www.emailjs.com par account banayein.
2. **Email Services → Add New Service** → **Gmail** select karein → `mrsinghpublications@gmail.com` se connect karein.
3. **Email Templates → Create New Template** banayein — isme ye variables rakhein: `{{to_email}}`, `{{book_title}}`, `{{ebook_link}}`, `{{ebook_password}}`, `{{customer_name}}`.
4. EmailJS dashboard se ye 3 cheezein copy karein: **Public Key**, **Service ID**, **Template ID**.
5. Site → Admin → **Tab 3** → EmailJS wale boxes me teeno paste karein → Save.

---

## STEP 6 — Books add karein (har book ke liye)

Admin → **Tab 1 (Add / Edit Book)**:

1. **Title, Author** (Dayashankar Singh pehle se bhara hoga), **Category** select karein. Nayi category chahiye to neeche **New category** box me likhein.
2. **Selling Price** dalen.
   - **Free eBook chahiye to Price `0` ya khali chhod dein** — book automatic Free eBooks section me aa jayega.
   - Paid book ke liye price dalen, MRP bhi dal sakte hain (discount dikhega).
3. **Cover photo** upload karein — cover ab poora dikhta hai, koi part cut nahi hota.
4. **Mark as NEW** par tick karein agar book nayi hai — card par NEW badge lagega.
5. **eBook PDF** upload karein (< 3.5 MB file seedha upload ho jayegi; badi file ke liye Google Drive link paste karein).
   - PDF upload kiye bina Download button kaam nahi karega — customer ko "not uploaded yet" dikhega.
6. **Printed book** ke liye: Platform select karein (Amazon / Flipkart / Meesho), **Listing URL** paste karein, printed price dalen.
7. **Payment Link** (is book ke liye alag link ho to) — khali chhodein to global link use hoga.
8. **Status:** Live / Draft / Scheduled select karein → **Save Book**.

> **New book add karte hi** sabhi users ko automatic "New Book" notification chali jayegi.

---

## STEP 7 — Coupons banayein (5 minute)

Admin → **Tab 5 (Coupons & Offers)**:

1. **Coupon Code** likhein (jaise `WELCOME10`).
2. **Discount Type:** Percent (%) ya Flat (₹) select karein, **Value** dalen (jaise 10).
3. **Min Books Bought:** coupon tabhi chalega jab customer ne pehle se utni books kharidi hon (is book ko milakar). Koi shart nahi chahiye to `0` rakhein.
4. **Min Order Amount, Expiry Date, Max Uses** (0 = unlimited) — sab optional hain.
5. **Generate Coupon** dabayein.
6. **Bulk Discount** (bina coupon ke automatic): 2nd book se kitne % aur 3rd book se kitne % — dal kar **Save Bulk Discount** dabayein.

> Customer checkout me coupon code dal kar **Apply** karega. Discount **sirf in-app Razorpay** checkout par lagta hai — payment link par full price lagega (wahan note bhi dikhta hai).

---

## STEP 8 — Notifications bhejein (2 minute)

Admin → **Tab 6 (Notifications)**:

1. **Title** aur **Message** likhein → **Send to All Users** dabayein.
2. Sabhi users ke bell (🔔) icon par notification aa jayegi.
3. Users ko **asli push** (phone lock hone par bhi) ke liye: Step 4E wali VAPID key dalni hogi, aur user ko bell icon → **Enable Push Notifications** dabana hoga.

---

## STEP 9 — Customer side se test karein (10 minute, zaroori)

Apne mobile se, customer ki tarah test karein:

1. Site kholein → **Login / Sign Up** → mobile number se OTP ya Google se login karein.
2. **My Profile** kholein → DP photo, naam, mobile, email, gender, **Exam Preparation**, address bharein → **Save Profile**.
3. Ek **Free eBook** par **Get Free eBook** dabayein → **My Library** me dikhna chahiye → **Read Now** se khulna chahiye. Download/email nahi hona chahiye (free book ke liye yehi sahi hai).
4. Ek **paid book** khareedein (pehle test key se) → payment ke baad **I Have Paid — Confirm My Order** dabayein → Download + password + Read Now check karein.
5. Checkout me ek **coupon code** dal kar Apply karein — discount dikhna chahiye.

---

## Agar kuch kaam na kare to — Quick Fix Table

| Problem | Wajah | Fix |
|---|---|---|
| Site purani dikh rahi hai | Browser cache | `Ctrl + Shift + R` hard refresh, ya mobile browser band karke dobara kholein |
| Gmail login nahi ho raha | Google Enable nahi / domain authorize nahi | Step 4B + 4C karein, phir Admin Tab 3 → Diagnose dabayein |
| OTP nahi aa raha | Phone Enable nahi / domain authorize nahi | Step 4B + 4C karein; email par OTP kabhi nahi aata — OTP sirf mobile par aata hai |
| "Live" dikh raha par login fail | Config sahi, provider OFF hai | Step 4B karein — config connect hona kaafi nahi hai |
| Payment button nahi khul raha | Na link hai, na Key ID | Step 3 karein — Razorpay Key ID ya payment link, ek to chahiye |
| eBook download nahi ho raha | PDF upload nahi hui | Step 6, point 5 — Admin Tab 1 se PDF upload karein |
| Customer Details khali hai | Koi register nahi hua / dusre browser se login hua | Customer ko isi site par Sign Up karwayein; data usi browser/device ka dikhta hai |
| Notification nahi aayi | User ne site kholi nahi / push enable nahi | In-app notification bell par dikhti hai; asli push ke liye Step 4E + Enable Push |

---

## Aage — App banana (baad me)
Website poori tarah set hone ke baad app banega: PWA Install (browser menu → Add to Home Screen), ya PWABuilder se Play Store (TWA), ya Capacitor se APK. Iske steps `README.md` me likhe hain. Pehle website ka setup poora kar lein.

---

## Ek page me checklist ✅
- [ ] isroot.in DNS me CNAME + GitHub Pages me custom domain set (Step 0)
- [ ] GitHub par 8 files upload + hard refresh
- [ ] Admin password `admin123` se badla
- [ ] Razorpay Key ID ya payment link dala
- [ ] Firebase: Google + Phone Enabled
- [ ] Firebase: domain `mrsinghpublications.isroot.in` authorized
- [ ] Firebase config Tab 3 me paste + Test + Diagnose OK
- [ ] (Optional) EmailJS keys dale
- [ ] Har book me eBook PDF upload + price set (0 = Free)
- [ ] Printed listing links dale (agar printed bechna hai)
- [ ] Ek coupon banakar test kiya
- [ ] Customer side se Free + Paid book test kiya
