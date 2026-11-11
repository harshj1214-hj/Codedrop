// Codedrop service worker: lets the app open with no internet, so QR-animation transfers work fully offline.
// Bump VERSION whenever you want every phone to drop its old copy at once (new pages are picked up anyway).
const VERSION = 'codedrop-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'];
const LIBS = ['https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js', 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(CORE);
    // The QR libraries are cached too, but a blocked CDN must not stop the app from installing.
    await Promise.all(LIBS.map(async (url) => {
      try { const res = await fetch(url, { mode: 'cors' }); if (res.ok) await cache.put(url, res); } catch (e) { /* retried at runtime */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== VERSION) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('.supabase.co')) return; // file storage: always live, never cached

  // The page itself: fresh copy when online (so updates arrive), saved copy when offline.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) { const cache = await caches.open(VERSION); await cache.put('./index.html', res.clone()); }
        return res;
      } catch (e) {
        return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Icons, fonts and the QR libraries: answer from the cache at once and refresh it in the background.
  const cacheable = url.origin === self.location.origin || ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname);
  if (!cacheable) return;
  event.respondWith((async () => {
    const hit = await caches.match(req);
    const refresh = fetch(req).then(async (res) => {
      if (res.ok || res.type === 'opaque') { const cache = await caches.open(VERSION); await cache.put(req, res.clone()); }
      return res;
    }).catch(() => null);
    if (hit) { event.waitUntil(refresh); return hit; }
    return (await refresh) || Response.error();
  })());
});
