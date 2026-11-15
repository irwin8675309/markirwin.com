const CACHE_NAME = 'little-artists-v1'
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(APP_SHELL)
    const indexResponse = await cache.match(new URL('./index.html', self.location.href))
    if (indexResponse) {
      const html = await indexResponse.text()
      const assetUrls = new Set()
      const matcher = /(?:src|href)=["']([^"']+)["']/g
      let match = matcher.exec(html)
      while (match) {
        const raw = match[1]
        if (!raw || raw.startsWith('data:') || raw.startsWith('http')) {
          match = matcher.exec(html)
          continue
        }
        try {
          const url = new URL(raw, self.registration.scope)
          if (url.origin === self.location.origin) assetUrls.add(url.href)
        } catch {
          // Ignore malformed asset references.
        }
        match = matcher.exec(html)
      }
      await Promise.all([...assetUrls].map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'reload' })
          if (response.ok) await cache.put(url, response)
        } catch {
          // A missing optional asset should not block installation.
        }
      }))
    }
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.endsWith('/sw.js')) return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request)
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME)
          await cache.put(request, response.clone())
        }
        return response
      } catch {
        const cache = await caches.open(CACHE_NAME)
        const cached = await cache.match(request)
        if (cached) return cached
        return (await cache.match(new URL('./index.html', self.location.href))) ?? Response.error()
      }
    })())
    return
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)
    if (cached) return cached
    try {
      const response = await fetch(request)
      if (response.ok && response.type === 'basic') await cache.put(request, response.clone())
      return response
    } catch {
      return Response.error()
    }
  })())
})