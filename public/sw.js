// Cache version - increment this to force all clients to update
const CACHE_VERSION = '20260110-v1'; // Fixed auth caching issues
const CACHE_NAME = `hostelmate-${CACHE_VERSION}`;
const RUNTIME_CACHE = `hostelmate-runtime-${CACHE_VERSION}`;

const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Immediately activate the new service worker
        self.skipWaiting();
      })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // NEVER cache auth-related requests - always go to network
  if (url.pathname.includes('/auth') || 
      url.pathname.includes('/login') || 
      url.pathname.includes('/signup') ||
      url.pathname.includes('/callback') ||
      url.hostname.includes('supabase')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Network-first for API calls (but don't cache user-specific data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Don't cache API responses that may contain user-specific data
          // Only cache truly static API responses
          return response;
        })
        .catch(() => {
          // For API failures, just return error - don't serve stale user data
          return new Response(JSON.stringify({ error: 'Network error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
  }
  // Network-first for HTML pages
  else if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Don't cache HTML to force updates
          return response;
        })
        .catch(() => {
          return caches.match('/offline.html');
        })
    );
  }
  // Cache-first for static assets
  else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((response) => {
              // Cache successful responses for static assets
              if (response && response.status === 200) {
                const clonedResponse = response.clone();
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(event.request, clonedResponse);
                });
              }
              return response;
            })
            .catch(() => {
              return caches.match('/offline.html');
            });
        })
    );
  }
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim clients immediately
      return self.clients.claim();
    }).then(() => {
      // Clear old user data from localStorage
      console.log('[SW] Cache updated - notifying clients to clear storage');
      return self.clients.matchAll();
    }).then((clients) => {
      // Notify all open tabs to refresh and clear auth
      clients.forEach((client) => {
        client.postMessage({
          type: 'CACHE_UPDATED',
          version: CACHE_VERSION
        });
      });
    })
  );
});
