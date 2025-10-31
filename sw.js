// Service Worker for FindMyDocs Offline Support
const CACHE_NAME = 'findmydocs-v2';
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/login.html',
    '/style.css',
    '/css/enhanced-features.css',
    '/css/document-uploader.css',
    '/css/profile.css',
    '/script.js',
    '/js/error-handler.js',
    '/js/loading-manager.js',
    '/js/app-state.js',
    '/js/performance-manager.js',
    '/js/search-manager.js',
    '/js/mobile-manager.js',
    '/auth.js',
    '/translations.js',
    '/ui.js',
    '/views.js',
    '/chat.js',
    '/map.js',
    '/documents.js',
    '/notifications.js',
    '/points-system.js',
    '/leaderboard.js',
    '/favicon.png',
    '/logofmd.jpg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets...');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('Service Worker installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip external requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('Serving from cache:', event.request.url);
                    return cachedResponse;
                }
                
                console.log('Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        // Cache the response
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch((error) => {
                        console.error('Fetch failed:', error);
                        
                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // Return cached version if available
                        return caches.match(event.request);
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'document-upload') {
        event.waitUntil(syncDocumentUploads());
    } else if (event.tag === 'chat-messages') {
        event.waitUntil(syncChatMessages());
    }
});

// Sync document uploads
async function syncDocumentUploads() {
    try {
        const cache = await caches.open('offline-queue');
        const requests = await cache.keys();
        
        for (const request of requests) {
            if (request.url.includes('/api/documents')) {
                try {
                    const response = await fetch(request);
                    if (response.ok) {
                        await cache.delete(request);
                        console.log('Synced document upload:', request.url);
                    }
                } catch (error) {
                    console.error('Failed to sync document upload:', error);
                }
            }
        }
    } catch (error) {
        console.error('Document upload sync failed:', error);
    }
}

// Sync chat messages
async function syncChatMessages() {
    try {
        const cache = await caches.open('offline-queue');
        const requests = await cache.keys();
        
        for (const request of requests) {
            if (request.url.includes('/api/chats')) {
                try {
                    const response = await fetch(request);
                    if (response.ok) {
                        await cache.delete(request);
                        console.log('Synced chat message:', request.url);
                    }
                } catch (error) {
                    console.error('Failed to sync chat message:', error);
                }
            }
        }
    } catch (error) {
        console.error('Chat message sync failed:', error);
    }
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);
    
    const options = {
        body: 'Você tem uma nova notificação no FindMyDocs',
        icon: '/favicon.png',
        badge: '/favicon.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver Notificação',
                icon: '/favicon.png'
            },
            {
                action: 'close',
                title: 'Fechar',
                icon: '/favicon.png'
            }
        ]
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            options.body = data.message || options.body;
            options.title = data.title || 'FindMyDocs';
        } catch (error) {
            console.error('Failed to parse push data:', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification('FindMyDocs', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/index.html#notificacoes')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/index.html')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls;
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then((cache) => cache.addAll(urls))
        );
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Periodic sync triggered:', event.tag);
    
    if (event.tag === 'content-sync') {
        event.waitUntil(syncContent());
    }
});

// Sync content periodically
async function syncContent() {
    try {
        // Sync user data, documents, etc.
        console.log('Performing periodic content sync...');
        
        // This would typically involve syncing user data
        // and other important content that might have changed
        
    } catch (error) {
        console.error('Periodic sync failed:', error);
    }
}

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker script loaded');
