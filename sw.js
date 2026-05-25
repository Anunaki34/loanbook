/**
 * LoanBook PWA — Service Worker (sw.js)
 * Handles offline caching so the app loads instantly even without internet.
 */

const CACHE_NAME = 'loanbook-v1';
const SHELL = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap',
];

// ── INSTALL: Cache the app shell ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// ── ACTIVATE: Clean up old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: Cache-first for shell, network-first for API ──
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // API calls: always network, never cache
  if (url.includes('script.google.com')) return;

  // Font requests: cache-first
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return resp;
        })
      )
    );
    return;
  }

  // App shell: cache-first, fall back to network
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
