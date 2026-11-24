# Cashfree Dynamic Links — Deploy Guide (Mr Singh Publications)

Ye guide `createCashfreeLink` Cloud Function ko live karne ke liye hai.
Function ka kaam: frontend se bookId + couponCode lekar price calculate karna,
aur Cashfree se ek fresh dynamic payment link banana.

> **Sabse zaroori baat — Blaze plan:** Cloud Functions **deploy karne ke
> liye hi** project ko Blaze (pay-as-you-go) par upgrade karna ZAROORI hai.
> Bina Blaze ke deploy fail hota hai — "Your project must be on the Blaze
> (pay-as-you-go) plan" (Cloud Build API Spark/free plan par enable nahi
> hoti). Ye Cashfree function par bhi lagu hai aur sendPushBroadcast par
> bhi — 24 Nov 2026 ko deploy karke verify hua.
> Blaze me bhi free limit milti hai (har mahine 2 million function calls free,
> uske baad bahut chhota charge) — ek chhoti dukaan ke liye aam taur par
> bill ₹0 ya kuch rupay ke aas-paas rehta hai. Billing card lagana padta hai,
> par kharch tabhi hota hai jab free limit paar ho.

## Step 0 — Pehle se tayyar cheezein
- Firebase project: **mr-singh-publications** (ID: `mr-singh-publications-5e60c`)
- Cashfree account: **mrsinghpublications@gmail.com** (ACTIVE) — Live App ID
  `15241469726925319560ac1c37d6414251` pehle se Admin Tab 3 me dala hua hai.
- Is folder me files: `index.js` (function), `package.json`, `.gitignore`.
  Repo root me: `firebase.json`, `.firebaserc`.

## Step 1 — Blaze plan on karein
1. Firebase Console kholein: https://console.firebase.google.com/project/mr-singh-publications-5e60c
2. Neeche left me **Upgrade** (Spark plan ke paas) par click karein → **Blaze**
   (pay-as-you-go) chunein → billing account / card jodein → Confirm karein.
3. Budget alert lagana achha rehta hai: Billing → Budgets & alerts → naya
   budget (e.g. ₹500/month) with 50% / 100% email alerts.

## Step 2 — Computer par Firebase CLI set karein
Computer par Node.js 22 aur Firebase CLI chahiye (Node.js 20 Firebase par
30 Oct 2026 ko band ho chuka hai — `functions/package.json` me engines
node 22 hai):
```bash
npm install -g firebase-tools
firebase login            # Google account: dssmauryaofficial@gmail.com
cd <repo folder>          # jahan index.html + functions/ folder hai
firebase use mr-singh-publications-5e60c
```

## Step 3 — Cashfree Secret Key set karein (sabse sensitive step)
Secret Key **kabhi chat, file ya website me mat likhna** — sirf is command me:
```bash
firebase functions:secrets:set CASHFREE_CLIENT_SECRET
```
- Enter karne par CLI aapse secret maangega — Cashfree Dashboard →
  Developers → API Keys → **Secret Key** copy karke paste karein
  (Live wali — test/sandbox wali nahi).
- Test karna ho to pehle sandbox: `firebase functions:params:set CASHFREE_ENV sandbox`
  (live par wapas aane ke liye: `firebase functions:params:set CASHFREE_ENV live`).
- Secret Console se bhi banaya ja sakta hai: Google Cloud Console →
  Secret Manager → Create secret → Name `CASHFREE_CLIENT_SECRET` → value
  me Secret Key (project owner account se — mr-singh-publications project
  dssmauryaofficial@gmail.com ka hai).
- Dhyaan dein: deploy karte waqt Firebase poore codebase ke saare secrets
  check karta hai — secret exist nahi karta to sirf sendPushBroadcast ka
  deploy bhi fail hoga (Secret Manager 403 error).

## Step 4 — Deploy karein
```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```
- Deploy se pehle `functions/` folder me `npm install` zaroori hai, warna
  "Couldn't find firebase-functions package" error aata hai.
- Deploy ke waqt CLI params maangega: `CASHFREE_ENV` (live) aur
  `ADMIN_EMAIL` (mrsinghpublications@gmail.com) — defaults accept karein.
  Ye values `functions/.env.mr-singh-publications-5e60c` me save hoti hain
  (ye file repo me nahi jati).
- Pehli baar me 1–2 minute lagte hain. Deploy ke baad function ka naam dikhega:
  `createCashfreeLink(asia-south1)`.
- Function URL ka format: `https://asia-south1-mr-singh-publications-5e60c.cloudfunctions.net/createCashfreeLink`
  (frontend callable use karta hai, URL yaad rakhne ki zaroorat nahi.)

## Step 5 — Website par on karein
1. Website kholein → Admin login → **Tab 3 (Payment & Firebase)**.
2. **Cashfree Dynamic Links (Cloud Function)** wala checkbox **on** karein → Save.
3. Coupons Tab 5 me banaye hue coupons Admin login ke saath save hone par
   automatic Firestore me sync hote hain — server wahi se validate karta hai.
4. Kisi book par **Buy Now** karein → coupon code dalein (e.g. MRSINGH10) →
   **Pay with Cashfree** dabayein → Cashfree ke secure page par redirect
   hona chahiye, amount me discount laga hua dikhna chahiye.

## Step 6 — Payment ke baad wapas aana (return flow)
- Payment ke baad Cashfree customer ko wapas store par bhejta hai
  (`/?cf_return=1&order_id=...&link_status=PAID`).
- `link_status=PAID` ho to store order ko automatic confirm karke eBook
  Library me dikha deta hai. Agar status PAID nahi hai to order confirm
  NAHI hota — v19.3 me "I Have Paid" manual confirm hata diya gaya hai
  (bina payment ke eBook mil jata tha).
- Asli bank-grade verification (Cashfree webhook + server-side verify)
  is version me nahi hai — return URL par bharosa kiya jata hai. Webhook
  verification agla step hai, jab chahein tab add kar denge.

## Agar kuch gadbad ho
| Error / lakshan | Matlab / fix |
|---|---|
| `Runtime Node.js 20 was decommissioned ...` | Node 20 band ho chuka hai — `functions/package.json` me engines node 22 karein. |
| `Couldn't find firebase-functions package ...` | `functions/` folder me `npm install` karein, phir deploy karein. |
| `Secret Manager API ... 403` / `CASHFREE_CLIENT_SECRET` | Secret exist nahi karta — Step 3 karein (CLI ya Console se). |
| `failed-precondition: ... Blaze ...` ya function Cashfree call par fail | Blaze upgrade nahi hua — Step 1 karein. |
| `Cashfree is not configured ... (Client ID / Secret missing)` | Secret set nahi hai (Step 3) ya Admin Tab 3 me Cashfree App ID khaali hai. |
| `Coupon code not found` | Coupon Firestore me sync nahi hua — Admin login karke Tab 5 me coupon dobara Save karein. |
| `Book not found` / `not live` | Book Firestore me nahi hai ya live nahi hai — Admin se book add/live karein. |
| Function hi nahi milta (`not-found` / 404) | Deploy nahi hua ya galat project — `firebase use` + Step 4 dobara karein. |
| Checkbox on hai par purana link khul raha hai | Settings save nahi hui hogi — Tab 3 me Save dabayein, phir page reload karein. |

## Files
- `functions/index.js` — function ka code (secret isme nahi hai).
- `functions/package.json` — dependencies (firebase-admin, firebase-functions).
- `firebase.json` / `.firebaserc` — deploy config (repo root me).

## Push Notifications — sendPushBroadcast (v19.3)

`functions/index.js` me dusra function hai: **sendPushBroadcast**. Admin →
Notifications tab se title + body bhejta hai; ye function Firestore
`pushTokens` collection ke sabhi FCM tokens par real push bhejta hai (locked
phone par bhi). Sirf publisher (admin email) bhej sakta hai.

**Kaam karne ke liye kya chahiye:**
1. **VAPID key** — Firebase Console → Project Settings → Cloud Messaging →
   Web Push certificates → key copy karke Admin Tab 3 (ya Notifications tab)
   me dalen aur Save karein.
2. **Function deploy** — Cashfree wale function ki tarah:
   ```bash
   firebase deploy --only functions:sendPushBroadcast
   ```
   (Dono functions ek saath: `firebase deploy --only functions`.)
3. **Users ne push enable kiya ho** — customer bell icon → "Enable Push
   Notifications" dabaye (install kiye hue app me bhi wahi button hai). Uske
   baad uska token Firestore `pushTokens` me save hota hai; Admin tab me
   "Push subscribers: N device(s)" dikhega.

**Blaze zaroori hai ya nahi?** HAAN, zaroori hai — ye pehle galat likha tha, 24 Nov 2026 ko deploy karke verify hua: Cloud Functions deploy karne ke liye Cloud Build API chahiye, jo Spark (free) plan par enable nahi hoti. Deploy karte hi error aata hai — "Your project must be on the Blaze (pay-as-you-go) plan". FCM khud free hai, par **deploy ke liye Blaze (pay-as-you-go) chahiye** — ye Cashfree function par bhi lagu hai aur sendPushBroadcast par bhi. Upgrade ke baad hi `firebase deploy --only functions:sendPushBroadcast` chalega. Blaze me free limit milti hai (har mahine 2 million function calls free), isliye is chhote function ka kharcha aam taur par free limit ke andar rehta hai — par card add karna hi padega.

**Anonymous sign-in (customers ke liye):** Email/password se login karne
wale customers Firebase Auth me signed-in nahi hote, isliye unka customer
record aur push token Firestore me tabhi likha jata hai jab Firebase Console
→ Authentication → Sign-in method → **Anonymous** ON ho. Google / Phone
login wale customers ko iski zaroorat nahi hai.

**Status 24 Nov 2026:** sendPushBroadcast **DEPLOY ho gaya aur verify hua**
— v2, callable, asia-south1, 256 MB, Node.js 22 runtime
(`firebase functions:list` se verify, 12:07 IST). createCashfreeLink abhi
deploy NAHI hua hai (secret ab set hai — deploy karne par wo bhi live ho
jayega; Admin Tab 3 ka checkbox abhi bhi OFF hai).

**Test kaise karein:**
1. Apne phone par store kholein → bell icon → "Enable Push Notifications" →
   Allow karein.
2. Admin (Google login) → Notifications tab → "Push subscribers: 1 device(s)"
   dikhna chahiye.
3. Title + body likh kar Send dabayein → phone par push aana chahiye (app
   band ho tab bhi).
