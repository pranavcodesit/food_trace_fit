// Service Worker for Food Scanner PWA
const CACHE_NAME = 'foodscanner-cache-v1';
const OFFLINE_URL = '/offline.html';

// Resources to pre-cache
const RESOURCES_TO_CACHE = [
  '/',
  '/offline.html',
  '/static/css/style.css',
  '/static/css/icons.css',
  '/static/js/script.js',
  '/static/js/zxing.min.js',
  '/static/js/zxing-library.min.js',
  '/static/manifest.json',
  '/static/icons/icon-192x192.svg',
  '/static/icons/icon-512x512.svg',
  '/static/icons/scan-icon.svg',
  '/static/icons/education-icon.svg',
  // Education content
  '/static/education/nutrition-basics.html',
  '/static/education/food-labels.html',
  '/static/education/seasonal-foods.html',
  // Add fonts and other static assets
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching resources');
        return cache.addAll(RESOURCES_TO_CACHE);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.startsWith('https://fonts.googleapis.com')) {
    return;
  }
  
  // For API requests, use network-first strategy
  if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  
  // For other requests, use cache-first strategy
  event.respondWith(cacheFirst(event.request));
});

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If the request is for a page, return the offline page
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      return cache.match(OFFLINE_URL);
    }
    
    // Otherwise, just return the error
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cached response, throw the error
    throw error;
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/static/icons/icon-192x192.svg',
    badge: '/static/icons/icon-192x192.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});