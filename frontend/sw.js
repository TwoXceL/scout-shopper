const CACHE_NAME = 'scoutshopper-cache-v4';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/static/styles.css?v=3.6',
  '/static/app.js?v=3.6',
  '/static/icon-192.png',
  '/static/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Stale-While-Revalidate for app shell and static resources
  if (url.origin === location.origin && (url.pathname.startsWith('/static/') || url.pathname === '/' || url.pathname === '/manifest.json')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fetched = fetch(event.request).then((res) => {
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetched;
      })
    );
    return;
  }

  // Network-First with Cache Fallback for GET API requests
  if (event.request.method === 'GET' && url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }
        return response;
      }).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response(JSON.stringify({ offline: true, message: "Retail aisle dead zone: offline mode active" }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
});
