/* Offline support: the app shell is cached on first visit, shown from the cache, and refreshed in the background. */
const VERSION = 'mlo-a6b351d699';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if(url.origin !== location.origin && !fonts) return;
  e.respondWith(caches.open(VERSION).then(cache => cache.match(req, {ignoreSearch: url.origin === location.origin}).then(hit => {
    const fresh = fetch(req).then(res => { if(res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; });
    if(hit){ if(!fonts) fresh.catch(() => {}); return hit; }          /* cached copy now, newer copy next launch */
    return fresh.catch(() => url.origin === location.origin ? cache.match('./index.html') : Response.error());
  })));
});
