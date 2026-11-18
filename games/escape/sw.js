/* Ghosty, Spin, and Oakley's Great Escape — service worker.
 *
 * Caches the game shell so the adventure works offline after the first visit.
 * Uses a versioned cache and a network-first strategy for navigation so
 * updates are never blocked by stale files.
 */

const VERSION = 'great-escape-v2';
const SHELL = [
  './',
  './index.html',
  './styles/main.css',
  './src/main.js',
  './src/config.js',
  './src/art.js',
  './src/world-art.js',
  './src/levels.js',
  './src/board.js',
  './src/audio.js',
  './src/storage.js',
  './src/render.js',
  './src/game.js',
  './src/ui.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation: network-first so new deploys show up immediately.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('./index.html'))),
    );
    return;
  }

  // Static assets: stale-while-revalidate. Serve the cached copy instantly for
  // speed, but always re-fetch in the background so new deploys replace the old
  // files instead of being blocked by a stale cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});