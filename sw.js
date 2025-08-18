const CACHE_NAME = 'findmydocs-v1';
const urlsToCache = [
  '/FMD/',
  '/FMD/index.html',
  '/FMD/manifest.json',
  '/FMD/fmd-logo.jpg',
  '/FMD/assets/index-8ca656ee.js',
  '/FMD/assets/index-0cb1f50e.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});
