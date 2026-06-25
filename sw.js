/* ===================== Service Worker — شاورما الشامي ===================== */

const CACHE_NAME = 'alshami-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/firebase-config.js',
  '/track.html',
  '/404.html',
  '/manifest.json',
  '/assets/logo.png',
  '/assets/hero.jpeg',
  '/assets/shawarma_souri.jpeg',
  '/assets/shawarma_arabi.jpeg',
  '/assets/mixed_grill.jpeg',
  '/assets/cheese_fries.jpeg',
  '/assets/fatteh.jpeg',
  '/assets/hummus.jpeg',
  '/assets/spit.jpeg',
  '/assets/interior.jpeg',
  '/assets/exterior.jpg',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET and Firebase requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/404.html');
        });
      })
  );
});
