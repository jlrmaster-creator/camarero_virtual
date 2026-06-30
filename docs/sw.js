const CACHE_NAME = 'camarero-3.1.1';

const STATIC_URLS = [
  './manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_URLS)),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
  // Defer old cache cleanup — avoid deleting caches that current pages still reference.
  // Old caches remain available as fallback in the fetch handler.
  // Cleanup happens 60s after activation to let in-flight requests finish.
  setTimeout(() => {
    caches.keys().then(allKeys => {
      const oldKeys = allKeys.filter(k => k !== CACHE_NAME);
      return Promise.all(oldKeys.map(k => caches.delete(k)));
    });
  }, 60000);
});

self.addEventListener('message', event => {
  if (event.data === 'skip-waiting') {
    self.skipWaiting();
  }
});

async function findInCaches(request) {
  const allKeys = await caches.keys();
  for (const key of allKeys) {
    const cached = await caches.open(key).then(c => c.match(request));
    if (cached) return cached;
  }
  return null;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request)),
    );
    return;
  }

  // Network-first for navigations (HTML) — always fetch fresh index.html.
  // Never cache HTML to avoid serving stale pages that reference deleted JS chunks.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(url.href).then(cached => cached ?? findInCaches(request)),
      ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return findInCaches(request).then(found => {
        if (found) return found;
        return fetch(request).then(response => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      });
    }),
  );
});
