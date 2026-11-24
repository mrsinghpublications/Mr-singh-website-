# Mr Singh Publications — Website + App

**Website:** https://mrsinghpublications.isroot.in
**Tagline:** Good Books | Greater Minds
**Owner/Author:** Dayashankar Singh (Mr Singh) — mrsinghpublications@gmail.com

## What's inside this ZIP
| File | What it is |
|---|---|
| `index.html` | The complete store — single file, all features (see SPEC.md). **v6: Tailwind CSS is compiled inside this file — no Tailwind CDN needed.** |
| `logo.png` | Transparent gold logo (header, auth, admin, footer) |
| `icon.jpg` | App icon / favicon (512×512) |
| `manifest.json` | PWA manifest (name, icons, start URL = the website) |
| `sw.js` | Service worker — offline shell for the PWA (v19 cache `msp-v19`) |
| `README.md` | This file |
| `SPEC.md` | Cumulative spec — every rule from v1–v19 |

Upload **all seven** files together to the same folder. `index.html` alone works, but install-as-app needs `manifest.json` + `sw.js` beside it. **After uploading v19, hard-refresh once (Ctrl+Shift+R)** — the service worker cache name changed, so the new version loads instead of the cached v18.

## 1. Host the website (isroot.in)
1. In your isroot.in / hosting panel, point the domain `mrsinghpublications.isroot.in` to your hosting folder (or GitHub Pages, then add the domain as a custom domain there).
2. Upload `index.html`, `logo.png`, `icon.jpg`, `manifest.json`, `sw.js` to the root of that site.
3. Open https://mrsinghpublications.isroot.in — you should see the store.
4. On the **website**, both buttons are visible: **Login / Sign Up** (customer) and **Admin Panel**.

## 2. Website vs App — how it works
- **Website:** Customer Login + Admin Panel both available.
- **App (installed PWA / `?app=1` / User-Agent `MrSinghApp`):** customer-only. The Admin button is hidden, and `#/admin`, the Admin login modal and Google Admin login all show a **403 — Forbidden in App Mode** screen.
- Try it: open the site with `?app=1` at the end of the URL to preview App Mode, and `?mode=web` to go back to Website Mode. Footer links do the same.

## 3. Convert to an App (after hosting)
Pick **one** route:

### A. PWA install (fastest, no store needed)
On Android Chrome: menu → **Add to Home screen** / **Install app**. On iPhone Safari: Share → **Add to Home Screen**. The installed app opens in standalone mode, so the Admin guard applies automatically.

### B. TWA via PWABuilder (Play Store, no code)
1. Go to https://www.pwabuilder.com → paste `https://mrsinghpublications.isroot.in` → **Start**.
2. Download the Android (TWA) package, sign it, upload to Google Play.
3. The TWA opens the website in a WebView — Admin is hidden by the standalone-mode guard.

### C. Capacitor (full APK, recommended for the User-Agent rule)
```bash
npm i -g @capacitor/cli
mkdir msp-app && cd msp-app
npx cap init "Mr Singh Publications" com.mrsingh.publications --web-dir=.
# Copy index.html, logo.png, icon.jpg, manifest.json, sw.js into this folder
npx cap add android
```
Then in `android/app/src/main/java/com/mrsingh/publications/MainActivity.java`, set the WebView User-Agent so the Admin guard triggers:
```java
import android.webkit.WebSettings;
import android.webkit.WebView;
// inside onCreate, after super.onCreate:
WebView webView = getBridge().getWebView();
WebSettings s = webView.getSettings();
s.setUserAgentString(s.getUserAgentString() + " MrSinghApp/1.0");
```
And point the app at the live site instead of local files — in `capacitor.config.ts`:
```ts
server: { url: 'https://mrsinghpublications.isroot.in', cleartext: false }
```
Then `npx cap sync android` and build the APK/AAB in Android Studio.

## 4. The Admin 403 — real server rule (IMPORTANT)
The guard inside `index.html` is client-side: it hides Admin in the app and shows 403 for `#/admin`. A tech-savvy user can bypass anything client-side, so **also add this rule at your host**. It blocks any request whose User-Agent contains `MrSinghApp` from reaching `/admin`:

**Apache (.htaccess)**
```apache
RewriteEngine On
RewriteCond %{HTTP_USER_AGENT} MrSinghApp [NC]
RewriteRule ^admin - [F,L]
```

**Cloudflare (WAF custom rule)**
```
(http.user_agent contains "MrSinghApp") and (http.request.uri.path contains "/admin")
→ Action: Block
```

**Nginx**
```nginx
if ($http_user_agent ~* "MrSinghApp") {
  location /admin { return 403; }
}
```

**Firebase Hosting (`firebase.json`)**
```json
{ "hosting": { "headers": [{ "source": "/admin", "headers": [{ "key": "X-Blocked", "value": "app" }] }] } }
```
Firebase Hosting cannot block by User-Agent in `firebase.json` alone — use a Cloud Function / Cloudflare rule in front of it instead.

> Note: in this single-file app, "admin" is a hash route (`#/admin`) inside `index.html`, so a host rule on the literal path `/admin` only blocks a separate admin page/route. The in-file guard is what blocks `#/admin` in the app. For a truly separate admin route you would need a backend or a second page — ask for that if you want it.

## 5. Settings you still have to fill in (Admin → Tab 3, and Tab 1 per book)
- **Payment link:** Cashfree / Razorpay global link (Tab 3) and/or per-book link (Tab 1). Empty by default.
- **Firebase config JSON:** Tab 3 — for live Google/Phone Auth, Firestore and Storage.
- **EmailJS keys:** Tab 3 — for automatic eBook email (otherwise the mailto fallback + instant download is used).
- **eBook PDF per book:** Tab 1 — upload (<3.5 MB) or paste a Drive/URL link.
- **Printed listing URL per book:** Tab 1 — Amazon / Flipkart / Meesho link + platform + printed price.
- **Selling prices:** Tab 1 — current prices are sample placeholders.
- **Kaidi ISBN:** Tab 1 — add the real ISBN when allotted (none invented).
- **Admin password:** the default is shared with you in chat only — it is never shown on the site. Change it in Admin → Tab 3 → Change Password. After changing it, sign in with Google once so the new password works in every browser.

## 6. Payment gateway keys & Firebase login (v7)
- **Razorpay Key ID:** Admin → Tab 3 → Payment Gateway API Keys → Razorpay Key ID. Dashboard → Settings → API Keys se copy karein. Link na ho to isi se in-app checkout khul jayega.
- **Cashfree App ID:** Tab 3 me hi. Sirf App ID se checkout nahi khulta — Cashfree ke liye payment link ya backend chahiye.
- **Secret Key kabhi na dalen** — is file me daali hui secret key koi bhi dekh sakta hai.
- **Gmail login / OTP na aaye to:** Admin → Tab 3 → **Diagnose Login / OTP** dabayein. Sabse common wajahen: (1) Firebase Console → Authentication → Sign-in method me Google/Phone **Disabled** hai, (2) Authorized domains me `mrsinghpublications.isroot.in` add nahi hai. Diagnose button dono check karke exact fix batata hai. Gmail users sign in with Google; mobile users get an OTP on their phone.

## 7. v8 features (Free eBooks, Library, Profile, Coupons, Notifications)
- **Free eBook:** Admin → Add Book → Price `0` ya khali chhoden. Book Free eBooks section me aa jayega; customer login karke "Get Free eBook" dabaye — Library me add hoga, sirf app/website me read hoga, email/download nahi hoga.
- **Coupons:** Admin → Tab 5 → code, %/flat, min books, min amount, expiry, max uses. Customer checkout me code dal kar Apply kare. Discount sirf in-app Razorpay par lagta hai.
- **Customer Details:** Admin → Tab 4 neeche. Passwords kabhi nahi dikhte (hash hote hain).
- **Notifications:** Admin → Tab 6 → title + message → Send to All Users (in-app). Asli push ke liye VAPID key wahi dalen; users ko bell → Enable Push Notifications dabana hoga.

## 9. v19 — one password + one book list on every browser (23 Nov 2026)
- **Password:** ab ek hi password har browser me chalta hai — password hash ke roop me cloud me sync hota hai. Password badalne ke baad Google se Admin login ek baar karein, tabhi wo har browser me chalega; bina Google login ke wo sirf usi browser me badlega (screen par saaf bata diya jayega).
- **Books:** Admin me publish ki hui book ab website par tab dikhegi jab Google se Admin login ho (warna cloud me save hi nahi hoti — pehle ye chupchaap fail ho jata tha, ab Admin me saaf warning aati hai). **Upload ke baad pehle USI browser me site kholein jisme book publish ki thi, Google se Admin login karein — book apne aap cloud me chali jayegi.**
- **Covers:** Google Drive link paste karne par ab seedha cover dikhega (Drive file "Anyone with the link" par share honi chahiye). Photo upload karne par cover usi browser me dikhega; dusre browsers par dikhane ke liye Tab 3 me File Storage Provider = Firebase Storage karein (Google login ke saath), ya Drive link use karein.
- **Login screen:** default password ab site par kahin nahi dikhta; Google button par sirf "Login with Google" likha hai.
- **v19.1 (same evening):** ek aur sudhaar — ab sirf site kholne se purani books cloud mein dobara nahi jayengi; cloud mein book tabhi jayegi jab aap Admin mein Save karein ya Google se Admin login karein.
- **v19.2 (24 Nov, subah):** cover ka asli kaaran mil gaya — Drive ka `uc?export=view` link browser mein cover ke roop mein khulta hi nahi (Google 403 deta hai), isliye har baar fallback dikhta tha. Ab site Drive link ko Google ke thumbnail link mein badal deti hai, jo browser mein seedha photo ki tarah khulta hai. Aapko kuch dobara karne ki zaroorat nahi — pehle se laga hua cover link ab apne aap dikhne lagega.
- **v19.2.1 (24 Nov, subah):** thumbnail wala tareeka bhi browser mein nahi chala — browser ke purane Google login ki wajah se Google photo dikhane se pehle sign-in maang leta hai. Isliye cover ab site ke andar hi rakha gaya hai (`bpsc-guide-cover.jpg`), aur book ka cover ab site ke apne link par hai — ab kisi bhi browser mein, bina Google sign-in ke, cover dikhega.
- Verified: 32/32 automated checks (multi-browser simulation, Firestore rules ke saath) — SPEC.md v19 dekhein.
- All inline scripts pass `node --check` (7 scripts), zero `TODO` strings. v7: Razorpay Checkout SDK added, Firebase diagnosis + redirect fallback added.
- Glass values match SPEC.md exactly: `rgba(255,255,255,0.78)`, blur 18px, border `rgba(212,175,55,0.32)`.
- Seed books: BPSC History (Live, real ISBN 978-93-346-0497-9) + अहसासों का कैदी (Live/Bestseller, no invented ISBN).
- Live-browser visual check was **not** possible from this machine (local server / link unreachable from the test browser) — please check Buy eBook, Reader, Admin login and the `?app=1` 403 screen yourself after uploading.

## 10. v19.3 — payment bypass band; customers Admin me; real push (24 Nov 2026)
- **"I Have Paid" button hata diya:** paid book ke checkout me ab ye button dikhega hi nahi — bina pay kiye koi eBook + password nahi paa sakta. Sirf free (₹0) order par ye button dikhta hai. Payment ke baad hi confirm hota hai — Cashfree link ya in-app Razorpay se. **Dhyaan dein:** UPI ID se pay karke khud confirm karne ka rasta ab band hai — customer ko Cashfree link ya Razorpay se pay karna hoga.
- **Customers Admin me:** koi bhi customer kisi bhi phone/browser se login kare, uski poori details (photo, naam, email, mobile, gender, exam, address, orders, spent) Admin → Customers tab me dikhengi. Password kabhi nahi dikhta. **Ek chhota sa kaam aapka:** Firebase Console → Authentication → Sign-in method → **Anonymous** ON karein, taaki email/password se login karne wale customers bhi dikhein (Google / Phone login wale waise bhi dikhte hain).
- **Real push notifications:** Admin → Notifications tab se title + message bhejkar ab sabhi users ke phone par push jayega (app band ho tab bhi), in-app ke saath. Tab me "Push subscribers: N device(s)" dikhega — kitne phones par push jayega. **Pehli baar ke liye do kaam:** (1) VAPID key Admin me dalen (Firebase Console → Project Settings → Cloud Messaging → Web Push certificates) — ho gaya, 24 Nov ko save hui. (2) Cloud Function deploy karein — `firebase deploy --only functions:sendPushBroadcast`. **Dhyaan dein (24 Nov ko verify hua): iske liye Blaze (pay-as-you-go) upgrade zaroori hai** — bina Blaze ke deploy fail hota hai (Cloud Build ki wajah se). Customers ko ek baar bell icon → "Enable Push Notifications" dabakar Allow karna hoga — uske baad unke phone par notification aayegi.

## 11. v19.4 — UPI payers ke liye Admin manual confirm (24 Nov 2026)
- **UPI se pay karne wale customers ke liye rasta wapas:** checkout me UPI ID ke neeche ab "I Paid via UPI — Notify Admin" button hai. Customer UPI se pay karke ye dabata hai — order "pending" banta hai, par eBook tab tak **nahi** milta jab tak aap confirm na karein.
- **Admin confirm:** Admin → Customers tab → Orders me pending order ke saath **"Confirm Payment — eBook De Do"** button hai. Apne UPI app / bank me payment dekhne ke baad dabayein — tabhi customer ko eBook + password milega (My Orders / Library me). Bina confirm kiye customer read/download/email kuch nahi kar sakta.
- **Hisab saaf:** pending (verify na hua) order customer ke Books count ya Spent me nahi gina jata — sirf confirm hone ke baad gina jata hai.
