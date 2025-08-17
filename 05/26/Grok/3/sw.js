const CACHE_NAME = 'physics-student-app-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/courses.json', // اضافه کردن فایل دروس
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.2/css/all.min.css',
    'https://cdn.fontcdn.ir/Font/Persian/Vazirmatn/Vazirmatn-Regular.woff2',
    'https://cdn.jsdelivr.net/npm/fullcalendar@5.11.5/main.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/fullcalendar@5.11.5/main.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});