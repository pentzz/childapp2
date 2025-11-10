/**
 * Service Worker for PWA
 * מאפשר caching, offline access ושיפור ביצועים
 */

const CACHE_NAME = 'childapp2-v1';
const STATIC_CACHE = 'childapp2-static-v1';
const DYNAMIC_CACHE = 'childapp2-dynamic-v1';
const IMAGE_CACHE = 'childapp2-images-v1';

// קבצים שתמיד נשמור ב-cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/App.css',
  '/styles.ts',
  '/manifest.json',
];

// התקנת Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// הפעלת Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== IMAGE_CACHE
          ) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - אסטרטגיית caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // דלג על non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // דלג על Supabase API calls (תמיד לקבל מהשרת)
  if (url.origin.includes('supabase.co')) {
    return;
  }

  // דלג על Gemini API calls
  if (url.origin.includes('generativelanguage.googleapis.com')) {
    return;
  }

  // אסטרטגיה לתמונות: Cache First
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          return (
            response ||
            fetch(request).then((fetchResponse) => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            })
          );
        });
      })
    );
    return;
  }

  // אסטרטגיה לקבצים סטטיים: Cache First
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
    return;
  }

  // אסטרטגיה כללית: Network First, fallback to Cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // שמור רק תגובות תקינות
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // אם אין רשת, נסה cache
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }

          // אם אין ב-cache, החזר דף offline
          if (request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Background Sync - לבקשות שנכשלו
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // כאן ניתן לסנכרן נתונים שנשמרו offline
  console.log('[Service Worker] Syncing data...');
}

// Push Notifications (אופציונלי)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'התקבלה התראה חדשה',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(
    self.registration.showNotification('ChildApp2', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
