const CACHE_NAME = 'notes-cache-v4';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v1';

const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/icons/favicon-16x16.png',
    '/icons/favicon-32x32.png',
    '/icons/favicon-48x48.png',
    '/icons/favicon-128x128.png',
    '/icons/favicon-192x192.png',
    '/icons/favicon-512x512.png',
    '/icons/apple-touch-icon.png',
    '/content/home.html',
    '/content/about.html'
];

// Установка — кэшируем статику
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Активация — чистим старые кэши
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// ЕДИНЫЙ обработчик fetch
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Пропускаем внешние запросы (CDN, шрифты и т.д.)
    if (url.origin !== location.origin) return;

    // Динамические страницы (/content/*) — стратегия Network First
    if (url.pathname.startsWith('/content/')) {
        event.respondWith(
            fetch(event.request)
                .then(networkRes => {
                    // Кэшируем успешный ответ
                    const resClone = networkRes.clone();
                    caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                        cache.put(event.request, resClone);
                    });
                    return networkRes;
                })
                .catch(() => {
                    // Если сети нет — берём из кэша
                    return caches.match(event.request)
                        .then(cached => cached || caches.match('/content/home.html'));
                })
        );
        return;
    }

    // Статика — стратегия Cache First
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('push', (event) => {
    let data = { title: 'новое уведомление', body: ''};
    if (event.data){
        data = event.data.json();
    }
    const options = {
        body: data.body,
        icon: '/icons/favicon-128x128.png',
        badge: '/icons/favicon-48x48.png'
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
});