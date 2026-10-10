/**
 * YOGI MANAGEMENT SYSTEM — Service Worker (PWA)
 * File: sw.js 
 */

const CACHE_NAME = "yogi-app-v1";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./css/fontawesome.min.css",
  "./js/config.js",
  "./js/api.js",
  "./js/auth.js",
  "./js/dashboard.js",
  "./js/leaders.js",
  "./js/yogi.js",
  "./js/yogi-summary.js",
  "./js/app.js"
];

// Install Event: Cache Static Shell Assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up Old Caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-first for API, Cache-first for Static Assets
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Skip API requests from caching (Workers API)
  if (url.searchParams.has("action") || url.pathname.includes("/api")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Background update cache
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Offline fallback */});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
