/* App-shell cache. There is no server dependency, so the app must work fully
   offline — a user opening it on the train is the normal case, not an edge one.

   Bump CACHE on every deploy; the old cache is deleted on activate. */
const CACHE = 'nowline-v3'

const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/fonts/fonts.css',
  '/fonts/SpaceGrotesk-var-latin.woff2',
  '/fonts/LeagueSpartan-var-latin.woff2',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // Individually, so one 404 cannot fail the whole install.
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Navigations: network first so a deploy is picked up, falling back to the
  // cached shell offline. Deep links resolve to index.html, matching .htaccess.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/index.html', copy))
          return res
        })
        .catch(() => caches.match('/index.html').then((r) => r || Response.error())),
    )
    return
  }

  // Assets are content-hashed by Vite, so cache first is safe and instant.
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit
      return fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
        }
        return res
      })
    }),
  )
})
