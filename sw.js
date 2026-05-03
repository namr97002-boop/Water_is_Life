const CACHE_NAME = 'login-cache-v2';
const LOGIN_URL = '/life/index.html';

// الملفات التي نخزنها
const urlsToCache = [
  '/life/',
  '/life/index.html'
];

// التثبيت - نخزن الملفات أول مرة
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 جاري تخزين شاشة الدخول...');
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting())
  );
});

// التفعيل - ننظف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('🗑 حذف الكاش القديم:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// الجلب - أهم جزء لشاشة الدخول
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // فقط نتعامل مع ملفات موقعنا
  if (url.pathname.startsWith('/life')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        // إذا كان الملف في الكاش → استخدمه فوراً
        if (cachedResponse) {
          console.log('✅ من الكاش:', url.pathname);
          return cachedResponse;
        }
        
        // وإلا حاول تجلبه من النت
        return fetch(event.request).then(networkResponse => {
          // خزنه في الكاش للمرة القادمة
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }).catch(() => {
          // إذا فشل النت والكاش → ارجع شاشة الدخول
          console.log('⚠️ لا نت ولا كاش → شاشة الدخول');
          return caches.match(LOGIN_URL);
        });
      })
    );
  }
});