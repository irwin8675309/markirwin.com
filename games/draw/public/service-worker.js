/* Little Canvas service worker.
 * The scope is the application folder, not the parent GitHub Pages site.
 * All cache keys are derived from this worker's own scope.
 */
const CACHE_PREFIX = "little-canvas-";
const APP_SCOPE = self.registration.scope;
const SCOPE_ID = (() => {
  let hash = 2166136261;
  for (let index = 0; index < APP_SCOPE.length; index += 1) {
    hash ^= APP_SCOPE.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
})();
let CACHE_NAME = `${CACHE_PREFIX}${SCOPE_ID}-fallback`;
const APP_URL = new URL("./", APP_SCOPE).href;
const INDEX_URL = new URL("index.html", APP_SCOPE).href;
const MANIFEST_URL = new URL("asset-manifest.json", APP_SCOPE).href;
const VERSION_URL = new URL("cache-version.json", APP_SCOPE).href;

function appUrl(path) {
  return new URL(path, APP_SCOPE).href;
}

function isInScope(url) {
  return url.startsWith(APP_SCOPE);
}

async function precache() {
  try {
    const versionResponse = await fetch(new Request(VERSION_URL, { cache: "reload" }));
    if (versionResponse.ok) {
      const metadata = await versionResponse.json();
      if (metadata && typeof metadata.version === "string" && metadata.version.length > 0) {
        CACHE_NAME = `${CACHE_PREFIX}${SCOPE_ID}-${metadata.version}`;
      }
    }
  } catch {
    // The fallback cache is still usable if version metadata is unavailable.
  }

  const cache = await caches.open(CACHE_NAME);
  const core = [APP_URL, INDEX_URL, appUrl("manifest.json"), appUrl("icons/icon-192.png"), appUrl("icons/icon-512.png")];

  try {
    const response = await fetch(new Request(MANIFEST_URL, { cache: "reload" }));
    if (response.ok) {
      const files = await response.json();
      if (Array.isArray(files)) {
        for (const file of files) {
          if (typeof file !== "string") continue;
          core.push(new URL(file, APP_SCOPE).href);
        }
      }
    }
  } catch {
    // The core shell is still cached if the generated manifest is unavailable.
  }

  await Promise.allSettled([...new Set(core)].map((url) => cache.add(new Request(url, { cache: "reload" }))));
  await self.skipWaiting();
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(`${CACHE_PREFIX}${SCOPE_ID}-`) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (!response.ok) throw new Error(`Network response ${response.status}`);
    await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request) || (fallbackUrl ? await cache.match(fallbackUrl) : undefined);
    if (cached) return cached;
    throw new Error("Offline and no cached copy is available.");
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin || !isInScope(url.href)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, INDEX_URL));
    return;
  }

  const path = url.pathname;

  // The catalog must never get stuck on a stale browser cache.
  if (path.endsWith("/coloring-library/catalog.json")) {
    event.respondWith(networkFirst(request, request.url));
    return;
  }

  // App shell and hashed build assets are immutable once built.
  if (
    path.endsWith(".js") ||
    path.endsWith(".css") ||
    path.endsWith(".png") ||
    path.endsWith(".svg") ||
    path.endsWith(".webmanifest") ||
    path.endsWith("manifest.json")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Coloring pages can be refreshed in the background while offline copies remain.
  if (path.includes("/coloring-library/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then(async (response) => {
            if (response.ok) await cache.put(request, response.clone());
            return response;
          })
          .catch(() => undefined);
        if (cached) {
          event.waitUntil(network);
          return cached;
        }
        const response = await network;
        if (response) return response;
        throw new Error("This coloring page is not available offline.");
      })(),
    );
  }
});