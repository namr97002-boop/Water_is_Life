// sw.js
const CACHE_NAME = 'soufai-system-v3';
const CACHE_VERSION = 'v3.0';
const assets = [
  './',
  './index.html',
  './manifest.json'
];

// التثبيت - نسخ الملفات الأساسية
self.addEventListener('install', event => {
  console.log('🔄 Service Worker: تثبيت الملفات...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ تم تخزين الملفات في Cache');
        return cache.addAll(assets);
      })
      .then(() => self.skipWaiting())
  );
});

// التنشيط - تنظيف الملفات القديمة
self.addEventListener('activate', event => {
  console.log('🎯 Service Worker: تفعيل');
  
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log(`🗑️ حذف Cache قديم: ${key}`);
            return caches.delete(key);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ Service Worker جاهز');
      return self.clients.claim();
    })
  );
});

// جلب الملفات - استراتيجية Cache First
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // تجاهل طلبات Google Sheets API (دائماً من الشبكة)
  if (url.href.includes('google.com') || url.href.includes('googleapis')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          console.log(`📂 من Cache: ${event.request.url}`);
          return cached;
        }
        
        console.log(`🌐 من الإنترنت: ${event.request.url}`);
        return fetch(event.request)
          .then(response => {
            // نسخ الاستجابة للتخزين
            const responseClone = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone);
              });
            
            return response;
          })
          .catch(err => {
            console.log('❌ فشل الاتصال:', err);
            
            // إذا طلب صفحة HTML وأخفقت
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
            
            return new Response('العمل في وضع عدم الاتصال', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// استقبال رسائل من الصفحة الرئيسية
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});