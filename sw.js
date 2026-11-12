const CACHE = 'hhqt-v1';
const CORE = ['index.html', 'img/437b7bf33b7b.webp', 'img/5bf9aa61560f.webp'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = (await cache.match(req)) || (await cache.match('index.html'));
      const net = fetch(req).then(res => {
        cache.put(req, res.clone());
        return res;
      }).catch(() => hit);
      return hit || net;
    })());
    return;
  }

  if (url.pathname.indexOf('/img/') >= 0) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});
