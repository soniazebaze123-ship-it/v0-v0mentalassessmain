// Bump this version whenever caching behavior changes so old caches are purged.
const CACHE_NAME = 'mentalassess-v2';

// Only cache stable, versionless static assets here.
// Never pre-cache the HTML shell ("/") — doing so can serve a stale app shell
// that references deleted JS chunks after a new deploy, crashing the app.
const STATIC_ASSETS = [
  '/offline.html',
  '/icons/icon-192x192.jpg',
  '/icons/icon-512x512.jpg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests.
  if (request.method !== 'GET') return;

  // Skip cross-origin requests.
  if (!request.url.startsWith(self.location.origin)) return;

  // Always go to the network for API calls.
  if (request.url.includes('/api/')) return;

  const url = new URL(request.url);

  // Never cache the HTML document or Next.js build assets. Serving a stale
  // app shell or stale hashed chunk after a deploy causes chunk-load errors
  // and a full client-side crash. These must always come from the network.
  const isDocument =
    request.mode === 'navigate' || request.destination === 'document';
  const isBuildAsset =
    url.pathname.startsWith('/_next/') || url.pathname.startsWith('/__nextjs');

  if (isDocument || isBuildAsset) {
    event.respondWith(
      fetch(request).catch(() => {
        // Offline fallback only for top-level navigations.
        if (isDocument) {
          return caches.match('/offline.html');
        }
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // For other same-origin assets (images, icons, fonts): network-first,
  // falling back to cache when offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
