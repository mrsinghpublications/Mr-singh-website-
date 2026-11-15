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
