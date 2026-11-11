const CACHE_NAME = "viewer-offline-cache";

const FILES_TO_CACHE = [
  "index.html",
  "style.css",
  "script.js",
  "jszip.min.js",
  "epub.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});