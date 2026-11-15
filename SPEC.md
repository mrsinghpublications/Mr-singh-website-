# Mr Singh Publications — Cumulative Spec (v1–v6)

Single source of truth for every rule set so far. The live file is `index.html` in this folder.

## v6 — Tailwind compiled, no CDN (2026-11-14)
- **Problem:** on the user's PC the live site rendered broken (huge logo, stacked header, full-width book cards) because the Tailwind Play CDN script (`cdn.tailwindcss.com`) did not load there. Inline CSS still worked (gold buttons), Tailwind utilities did not. The uploaded file itself was verified identical to the live file — the fault was the CDN dependency, not the upload.
- **Fix:** Tailwind CSS v3.4.17 compiled with the standalone CLI from `index.html` + `tailwind.config.js` (same gold/cream/ink colours, Playfair Display + Poppins fonts as the old Play-CDN config) and embedded as a `<style>` block inside `index.html` (18,858 bytes minified, 342 rules). The CDN `<script>` and the `tailwind.config` script are removed — zero `cdn.tailwindcss` references left.
- **Also fixed in v6:** `bg-white/92` (used in 6 places: status badges, barcode wrap) is not a Tailwind opacity step, so it never generated any CSS — changed to `bg-white/90` (visually identical). Verified: all 369 class tokens from the file are covered by the compiled CSS; 6 inline scripts + `sw.js` pass `node --check`; render check in a CSS engine confirmed header sticky, logo `h-11 sm:h-12` = 44/48px, `.hidden` = display:none, `max-w-7xl` = 1280px, `font-serif` = Playfair Display.
- **Rebuild rule:** if Tailwind classes are added/changed later, recompile with `tailwind.config.js` + `tailwind-input.css` (kept in this folder) and re-embed; do NOT bring the Play CDN back. `tailwind-compiled-v6.css` is the compiled output kept for reference.
- **Cache:** `sw.js` cache name bumped `msp-v5` → `msp-v6`, so returning visitors get the new file instead of the cached v5. Backup of the CDN version is `index-v5.html`.
- Still CDN (by design, layout no longer depends on them): Google Fonts, FontAwesome, JsBarcode, Firebase, EmailJS. If Fonts/FontAwesome are blocked, fallback fonts apply and the layout stays intact.

## Brand
- Brand: Mr Singh Publications — "Good Books | Greater Minds"
- Author/Owner: Dayashankar Singh (Mr Singh)
- Email: mrsinghpublications@gmail.com
- Address: Mr Singh Publications, Village Atimi, Post Atimi, Rohtas, Bihar – 821310, India
- Website: https://mrsinghpublications.isroot.in
- Logo: `logo.png` (transparent gold; gold SVG crest fallback if it fails to load). Icon/favicon: `icon.jpg`

## Theme (exact, do not change)
- Light only — NO dark/black theme anywhere.
- Backgrounds: #FFFFFF, #FDFBF7, #F5EFE6 / #F6F0E4, warm golden-beige ambient blurs.
- Accents: Royal Gold #D4AF37 / #C59B27 / #B8860B; text Deep Charcoal #1E1E1E.
- Glass (exact): `background: rgba(255, 255, 255, 0.78); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border: 1px solid rgba(212, 175, 55, 0.32); box-shadow: 0 10px 30px rgba(184, 134, 11, 0.08);`

## Seed books (do not invent values)
1. BPSC इतिहास संपूर्ण मार्गदर्शिका — Live, ₹449 (MRP ₹699, sample price), ISBN **978-93-346-0497-9** (RRRNA, allotted 11-11-2026, verified), 686 pp, History.
2. अहसासों का कैदी — Live / Bestseller, ₹299 (MRP ₹499, sample price), 149 pp, Novel & Literature. **No ISBN allotted — ISBN is blank, no barcode, no number invented.** Add the real ISBN in Admin when allotted.
- Prices are sample placeholders only (user never gave selling prices). Payment links are empty by default.
- v1 seed (BPSC guide, ISBN 978-93-346-0167-1, ₹499) lives in `index-v1.html` and can be re-added via Admin.

## Features (all in index.html)
- Storefront: sticky glass header, instant search (title/author/ISBN), category pills (All, Competitive Exams, Novel & Literature, History), sort, book cards with ISBN/barcode overlay (JsBarcode EAN-13), Live/Bestseller/Coming Soon badges, price + MRP strikethrough + % OFF.
- eBook-only store: "Buy eBook" here (per-book or global Cashfree/Razorpay link, UPI, WhatsApp, email) + "Printed • Amazon/Flipkart/Meesho" button opening the external listing (per-book link + platform + printed price, set in Admin).
- Customer Auth: Sign Up (name + Gmail/10-digit mobile, 6-digit OTP in 6 boxes, resend 30s timer, then Create/Confirm Password with eye toggle), Login (password or OTP), Continue with Google, Forgot Password via OTP. Demo Mode shows the OTP in a gold toast; Live Mode uses Firebase Auth (Google popup + Phone OTP, invisible reCAPTCHA) when Firebase keys are pasted in Admin Tab 3.
- Logged-in state: initials badge in header, My Orders / Profile modal, Logout. Buy requires login; orders are logged with order ID.
- Details modal: cover, synopsis, author, category, copyright, ISBN-13 + JsBarcode, Buy eBook + Buy Printed.
- Checkout confirmation: after "I Have Paid — Confirm My Order", buyer gets instant Download eBook + 6-character eBook password + "Read in App Now" + "Email eBook".
- In-App Reader: bought eBooks open in-app (PDF iframe), with Download + Request on Email; unlocks only after purchase.
- eBook Email Request: buyer requests, it lands in Admin Tab 4; Admin Accept & Send (auto via EmailJS if configured, else email app pre-filled) / Reject.
- Email delivery: EmailJS optional in Admin Tab 3 (public key / service / template); without it, mailto fallback + instant download.
- Admin (password `admin123`, changeable; Google Admin Login restricted to Admin Email, default mrsinghpublications@gmail.com):
  - Tab 1 Add/Edit: title/subtitle, author (default Dayashankar Singh), category, price/MRP/pages, cover upload (Base64) or URL + live preview, smart ISBN-13 auto-detector with live barcode, copyright (default © Mr Singh Publications. All Rights Reserved.), per-book payment link, eBook PDF upload (<3.5 MB in-app, bigger via Drive/URL) or URL, Printed store/platform/link/price, status Live/Draft/Scheduled + datetime picker, Make Live Now / Schedule Tomorrow 10 AM, description, Bestseller checkbox.
  - Tab 2 Manage: table with cover, title, category, price, ISBN, status, scheduled date; Edit / Live-Hold toggle / Reschedule / Delete; Export/Import JSON backup; Reset sample books.
  - Tab 3 Payment & Firebase: global Cashfree/Razorpay link, gateway selector, UPI, merchant, WhatsApp, announcement, Firebase config JSON + guide + Test, Admin Email, Firestore Sync ON/OFF, Storage provider (Browser / Firebase Storage / Cloudflare R2 + public base URL), EmailJS keys.
  - Tab 4 Customers & Orders: registered customers, all orders, eBook Email Requests with Accept/Reject.
- Firebase: Auth (customers + admin), Firestore sync (collections books, orders, ebookRequests, customers), Storage (covers/, ebooks/). R2 is paste-public-link mode only — R2 cannot be uploaded to safely from a browser with secret keys.
- Website vs App (v5): Website (`mrsinghpublications.isroot.in`) shows BOTH Customer Login and Admin Panel. App (PWA standalone / `?app=1` / User-Agent containing `MrSinghApp`) is customer-only: Admin button is hidden and any admin route (`#/admin`, Admin login, Google Admin login) returns a 403 screen. This is a client-side guard in a static file — it is NOT real backend security. The real 403 rule must be added at the host/backend (see README.md).

## Files to upload together
`index.html`, `logo.png`, `icon.jpg`, `manifest.json`, `sw.js` (+ `README.md`, `SPEC.md` for reference). Backups in this folder: `index-v1.html` … `index-v4-merged.html`.

## Still needs the user
- Cashfree/Razorpay payment link(s) — Admin Tab 3 / per-book.
- Firebase config JSON — Admin Tab 3 (for live Auth/Firestore/Storage).
- EmailJS keys — Admin Tab 3 (for automatic eBook email).
- Per-book eBook PDF (upload or URL) and Printed listing URL — Admin Tab 1.
- Real selling prices — Admin Tab 1 (current prices are samples).
- Kaidi ISBN when allotted — Admin Tab 1.
- Host rule for the App User-Agent 403 (see README.md) + DNS/hosting for mrsinghpublications.isroot.in.

## v7 (2026-11-15)
- Payment Gateway API Keys (Admin Tab 3, optional, link still optional): Razorpay Key ID (public, rzp_live_/rzp_test_) + Cashfree App ID/Client ID (public). Secret Key is NEVER entered/saved here — a public single file cannot keep a secret; secret belongs on a backend only.
- Razorpay Checkout (checkout.razorpay.com SDK): if gateway=Razorpay, no payment link, and Key ID is set, Buy Now shows "Pay with Razorpay" in-app checkout (amount = book price, UPI/card/net-banking); on success confirmOrder runs and the eBook + password are delivered. If a payment link exists, the link wins. Cashfree App ID alone cannot open in-app checkout (needs server session_id) — Cashfree still uses the payment link.
- Firebase login/OTP fixes: "Live" badge no longer lies — Diagnose button (Admin Tab 3) checks SDK, config, domain vs authDomain and lists the Console checks (Google + Phone must be Enabled; domain must be in Authorized domains). Google login: popup, then redirect fallback on popup-blocked/closed, with plain-language error + exact fix. Phone OTP: fresh rendered reCAPTCHA per attempt, cleared on error. Errors shown in #fbDiag (auth modal) and #fbDiagAdmin (Tab 3). Email OTP note: Firebase never sends OTP to email — email users use password/Google; real OTP is phone-only.

## v8 (2026-11-15)
- Free eBooks: price 0 ya khali => book automatic Free eBook (FREE badge, "Get Free eBook" button, alag Free eBooks section + Free eBooks pill). Free book login ke baad Library me add hota hai, sirf app/website reader me padha ja sakta hai — download aur email delivery dono band hain (downloadEbook / requestEbookEmail free orders par rokte hain).
- Login gate: bina login ke koi book buy/read nahi kar sakta — Buy/Read dabane par login screen khulti hai; login ke baad hi profile setup, buy, read, Library.
- My Library (header button + profile): customer ki kharidi hui + free books, Read Now (sab), Download (sirf paid).
- Profile setup (My Profile → Edit Profile): DP photo upload (200×200 crop, <2 MB), naam, mobile, email, gender, Exam Preparation (BPSC/UPSC/SSC/Banking/Railway/UPPSC/MPPSC/BSSC/NEET/JEE/CTET-STET/Defence/Other/Not preparing), address.
- Coupons (Admin Tab 5): code generate — % ya flat discount, min books, min order amount, expiry, max uses, active/inactive, delete. Checkout me coupon input + Apply; discount in-app Razorpay par lagta hai, payment link par full price (wahan note dikhta hai). Bulk discount (Tab 5): 2nd book se X%, 3rd se Y% — automatic, bina coupon ke.
- Customer Details (Admin Tab 4, neeche): DP, naam, email, mobile, gender, exam, address, joined, books, total spent. **Passwords kabhi nahi dikhaye jate** — hash hokar save hote hain, admin bhi nahi dekh sakta. Data sirf is browser/device ke customers ka hai (Firestore sync ON ho to wahan ke bhi).
- Push notifications (Admin Tab 6): title + message likh kar sabhi users ko in-app notification (bell icon + badge). New book add hote hi automatic "New Book" notification. Asli push (locked phone) ke liye FCM VAPID key field + Enable Push button + sw.js push/notificationclick handlers; broadcast server key se hota hai jo is file me nahi dala ja sakta.
- New tag: Add/Edit me "Mark as NEW" checkbox — card par NEW badge. Category: Add/Edit me dropdown + "New category" text field.
- Cover fix: sab cover images ab object-fit:contain (cream background) — cover ka koi part cut nahi hota.

## v9 — Cloud Settings (Firebase) — 2026-11-15
Problem: books/orders already synced to Firestore, but SETTINGS (Firebase config, Cashfree App ID, EmailJS keys, VAPID key, admin email) lived only in that browser's LocalStorage. On a new phone/computer the Admin panel had no config, so Google Admin login failed and all keys had to be re-entered.
Fix:
- Firebase web config embedded in index.html as DEFAULT_FIREBASE_CONFIG (public browser key, not a secret — safe to expose). Any device boots into Live Firebase mode with no paste needed.
- Settings saved to Firestore doc `config/settings` (write needs a Firebase-signed-in user, i.e. Google Admin login) and loaded from there on every start (cloud updatedAt wins; empty cloud values never wipe local values). New "Sync Settings to Cloud" button + status line in Admin Tab 3.
- Admin password is NOT in settings (separate LocalStorage key) and is never synced. No Secret Key is ever stored.
- Requires: Firestore Database created in Firebase Console + rules (read all, write only signed-in users) for collections books, orders, ebookRequests, customers, config.
- sw.js cache bumped msp-v8 → msp-v9 so devices fetch the new file.
- Backup: index-v8.html beside index.html. All 9 inline scripts pass node --check, zero TODOs.

## v10 — Short publisher address — 2026-11-15
User asked: full publisher address must NOT appear in publisher contact — keep it short: "Sasaram, Bihar – 821310, India".
- Contact/footer address changed: "Mr Singh Publications, Village Atimi, Post Atimi, Rohtas, Bihar – 821310, India" → "Mr Singh Publications, Sasaram, Bihar – 821310, India".
- About card changed: "Mr Singh Publications, Rohtas, Bihar" → "Mr Singh Publications, Sasaram, Bihar, India".
- No other content changed. Backup: index-v9.html. sw.js cache msp-v9 → msp-v10.

## v11 — Firestore books merge (seed books never lost, covers kept) — 2026-11-15
Bug: after "Erase Everything" + reload, only 1 book showed. Firestore held only b-kaidi — the History seed never reached Firestore (added before the Firestore Database existed; sync failed silently), and the local catalog had been wiped. A manual re-add made a wrong duplicate ("BPSC History Guide", no MRP/pages/ISBN, wrong category, no cover).
Fix: loadBooksFromFirestore now MERGES instead of replacing — Firestore books are used, empty covers/deliveryUrls are filled from the matching SEED_BOOKS entry (covers are data: URLs, sync strips them, so the file's own seed art is the source), and any missing SEED_BOOKS entry is added back locally and pushed to Firestore on the next save (self-healing, needs a signed-in admin). The wrong duplicate doc (b-1794706988743) must be deleted once in the Firebase Console.
- Backup: index-v10.html. sw.js cache msp-v10 → msp-v11. All 10 inline scripts pass node --check, zero TODOs.

## v12 — Email Us fix — 2026-11-15
Root cause: "Email Us" was a plain mailto: link. On a PC/phone with NO default mail app set up, clicking mailto: does nothing at all — no app opens, no error. That is why the button "did not work".
Fix: the button now opens a small panel with three ways that always work — 1. "Open in Gmail" (web compose, needs only a browser, no mail app), 2. "Open Mail App" (the old mailto:, for users with Outlook/Apple Mail), 3. "Copy" (copies mrsinghpublications@gmail.com). Same fix applied to "Ask About This Book" and "Order by Email", which were mailto: links too and failed the same way. Subject is set per button (book enquiry / order subject).
- Backup: index-v11.html. sw.js cache msp-v11 → msp-v12. All 11 inline scripts pass node --check, zero TODOs.

## v13 — Merge actually runs + real seed covers — 2026-11-15
Root cause of the v11 self-heal failure: the v11 override of loadBooksFromFirestore was defined AFTER the v9 block's immediate initFirebase() call, so on every page load the ORIGINAL version ran (replace books with Firestore docs, no seed merge) and the override was never invoked. "Reset to the 2 sample books" also did nothing in the cloud browser because resetSamples() uses confirm(), which that browser auto-dismisses (works in a real browser).
Fix: the merge is redefined here (last definition wins) and INVOKED on load, retried after 4s (Firebase Auth restores async; the push needs a signed-in admin), and re-run 1.5s after every Firebase sign-in. Cover fix in the same merge: a seed book whose stored cover is empty, the generic fallback SVG, or the broken /images/bpsc-history-cover.png URL (404) now gets the seed's real embedded cover art back — both cards show their real covers instead of the same gold placeholder.
- Backup: index-v12.html. sw.js cache msp-v12 → msp-v13. All 12 inline scripts pass node --check, zero TODOs.

## v14 — Backend auto-save complete (add/edit/delete) — 2026-11-15
User requirement: books added on the website must AUTOMATICALLY save to the backend (Firestore).
What already worked: saveBook() calls saveBooks(), whose wrapper calls syncAllBooksToFirestore() when Firestore is on — Add/Edit already pushed to Firestore (needs a signed-in admin, because Firestore rules only allow writes from an authenticated user).
GAP FOUND: deleteBook() only removed the book locally. Sync only SETs docs for books still in the list, so a deleted book stayed in Firestore and came back on the next fresh load. Same gap in resetSamples().
Fix: deleteBook() now also deletes the Firestore document; resetSamples() now deletes every Firestore book doc that is not one of the 2 seed books.
- Backup: index-v13.html. sw.js cache msp-v13 → msp-v14. All 13 inline scripts pass node --check, zero TODOs.

## v15 — Store emptied, owner adds books himself — 2026-11-15
User: "Jo book upload kiye ho hata do, wo mai krunga kyoki book me adhi edit krna baki hai."
Change: SEED_BOOKS is now EMPTY — both sample books (BPSC History, Ahsason Ka Kaidi) removed from index.html (titles/covers/prices gone from the file). Storefront starts with 0 books. The 2 Firestore docs (b-bpsc-history, b-kaidi) were NOT deleted — the v15 deploy task was stopped mid-flight at the owner's instruction (08:11 IST, 'koi book edit/upload mt kro'), before the console deletion step. Verified 08:14 IST: the docs still exist, so the v13 merge loads them back and the storefront still shows 2 books. v15 DID go live (commit 02f7022, 07:54 IST) before the stop. Reset button relabelled "Reset store — remove all books" and its Firestore cleanup now runs even when the local list becomes empty.
The owner adds books himself via Admin > Add Book after editing them; Add/Edit/Delete auto-save to Firestore (v14 fix included).
- Backup: index-v14.html. sw.js cache msp-v14 → msp-v15. All 14 inline scripts pass node --check, zero TODOs.

## v16 — Backend is the source of truth — 2026-11-15
BUG (found 08:24 IST): deleting the 2 books from Firestore did NOT empty the store. Every storefront load re-created them: the v13 merge did `if(snap.empty){ await syncAllBooksToFirestore(); }`, pushing the WHOLE local book list back — and that list comes from the browser's localStorage, which still held the 2 old books from an earlier visit (same on the owner's phone/PC). Console deletion could never stick.
FIX: Firestore is now the source of truth. If Firestore is empty, the store is empty — local books are dropped, never pushed back (except seed books, currently none, and books created in the last 60s, a just-added book whose sync may still be in flight). If Firestore has books, only those are used; local-only books are not merged back in (same 60s grace). Add/Edit/Delete still auto-save to Firestore (v14). A backend deletion is now FINAL.
- Backup: index-v15.html. sw.js cache msp-v15 → msp-v16. All 15 inline scripts pass node --check, zero TODOs.

## v17 — Fix the ORIGINAL loader too — 2026-11-15
ROOT CAUSE (found 08:47 IST): v16 did not stop the re-creation. The page calls initFirebase() / loadBooksFromFirestore EARLY, before the v11/v13/v16 override definitions exist — so on every load the ORIGINAL v9 loader ran first. Its empty-snap branch pushed the browser's saved copy of the books back into Firestore BEFORE the v16 merge ever ran; by the time v16's merge ran, the document already existed again. (Also explains why only History came back: the saved copy in that browser now holds only History.)
FIX: the harmful `if(snap.empty){ await syncAllBooksToFirestore(); }` branch is replaced IN PLACE in all three loader definitions (v9 original, v11 override, v13 override) with the v16 rule — empty backend means an empty store; local books are dropped, never pushed back (only seed books, currently none, and books created in the last 60s are kept).
- Backup: index-v16.html. sw.js cache msp-v16 → msp-v17. All 16 inline scripts pass node --check, zero TODOs.

## v18 — Cashfree Dynamic Links via Firebase Cloud Function — 2026-11-15
User request: checkout button se Cloud Function call ho, Cashfree se fresh dynamic payment link banaye (bookId + couponCode), user redirect ho jaye. Fayde: zero hardcoding, coupons supported, Secret Key server par safe.
NEW FILES (repo root me, GitHub Pages ke 8 files ke saath):
- `functions/index.js` — `createCashfreeLink` callable (asia-south1): book price Firestore se, bulk discount (confirmed orders gin kar), coupon `coupons` collection se validate, Cashfree Payment Links API se fresh link (har order alag link_id), pending order Firestore `orders` me, {link_url, order_id, amount} return. Secret Key code me NAHI — Secret Manager secret CASHFREE_CLIENT_SECRET se. Client ID (App ID) Firestore config/settings se.
- `functions/package.json` (firebase-admin ^13, firebase-functions ^6, Node 20), `functions/.gitignore`, `functions/DEPLOY_GUIDE.md` (Hinglish deploy steps).
- `firebase.json`, `.firebaserc` (project mr-singh-publications-5e60c).
FRONTEND (index.html): firebase-functions-compat.js SDK added; Admin Tab 3 me "Cashfree Dynamic Links (Cloud Function)" checkbox (settings.cfFunctionOn, default OFF — opt-in, off ho to kuch nahi badalta); Buy Now par on ho to "Pay with Cashfree" button → payWithCashfreeFunction → callable → Cashfree page redirect; return handler (/?cf_return=1&order_id=...&link_status=PAID) order confirm karta hai, PAID na ho to "I Have Paid" manual confirm abhi bhi chalta hai; coupons Admin Tab 5 me save hote hi Firestore `coupons` me sync hote hain (server validation ke liye).
BLOCKER — Blaze plan ZAROORI: free Spark plan par Cloud Function Cashfree (non-Google) ko call nahi kar sakta. Bina Blaze ke function deploy hoga par Cashfree call fail hogi. Deploy ke liye: Blaze upgrade + `firebase functions:secrets:set CASHFREE_CLIENT_SECRET` + `firebase deploy --only functions`. Webhook verification is version me nahi hai (return URL par bharosa — pehle wale "I Have Paid" flow jitna trusted).
- Backup: index-v17.html. sw.js cache msp-v17 → msp-v18. All 17 inline scripts pass node --check, functions/index.js passes node --check, zero TODOs. Deploy + live test abhi baaki hai (Blaze + secret user ke steps hain).
