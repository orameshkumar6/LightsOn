const CACHE = 'roomctrl-fb-v17';
const STATIC_ASSETS = [
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('firebaseio.com') || e.request.url.includes('firebasedatabase.app') || e.request.url.includes('googleapis.com')) return;
  if (e.request.url.includes('activate.html')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(() => new Response(
      'Activation page unavailable offline. Please connect to internet.',
      { headers: { 'Content-Type': 'text/plain' } }
    )));
    return;
  }
  if (e.request.destination === 'document' ||
      e.request.url.endsWith('index.html') ||
      e.request.url.endsWith('product-info.js') ||
      e.request.url.endsWith('license-registry.js') ||
      e.request.url.endsWith('license-registry-config.js') ||
      e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request).then(cached => cached || new Response(
          'Room Controller is offline and this page was never cached yet. Please connect to the internet and reload.',
          { headers: { 'Content-Type': 'text/plain' } }
        )))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
      return res;
    }).catch(() => cached || new Response('', { status: 504, statusText: 'Offline and not cached' })))
  );
});
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
