/* Mr Singh Publications — Service Worker (PWA offline shell + push) */
const CACHE = 'msp-v19-5';
const CORE = ['index.html', 'logo.png', 'icon.jpg', 'manifest.json'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Local files: cache-first, fall back to network. CDN / Firebase / payment links: network only.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('index.html')))
    );
  }
});
/* Push notifications (FCM): shows the notification even when the site is closed.
   v19.3: FCM ka payload `notification: {title, body}` ke andar aata hai (flat
   title/body nahi) — dono formats padhe jate hain, warna galat (default) text dikhta. */
self.addEventListener('push', (e) => {
  let data = { title: 'Mr Singh Publications', body: 'Aapke liye ek nayi khabar hai!' };
  try { if (e.data) { const raw = e.data.json(); const n = (raw && raw.notification) ? raw.notification : raw; data = Object.assign(data, n); } } catch (_) {}
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: 'icon.jpg',
    badge: 'icon.jpg',
    tag: 'msp-notif',
    data: { url: data.url || (data.fcmOptions && data.fcmOptions.link) || '/' }
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow(e.notification.data.url || '/');
  }));
});
