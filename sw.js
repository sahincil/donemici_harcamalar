// Dönemiçi İşlemler — Service Worker
// Uygulamayı çevrimdışı (internet olmadan) da açılabilir hale getirir.

const CACHE_NAME = 'donemici-islemler-v1';
const CORE_ASSETS = [
  './donemici_islemler_paneli.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Sadece GET isteklerini önbellekle yönet
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          // Geçerli yanıtları (kendi dosyalarımız veya CDN'den gelen fontlar/Chart.js) önbelleğe yaz
          if (response && (response.status === 200 || response.type === 'opaque')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // internet yoksa önbellekteki sürüme dön

      // Önbellekte varsa hemen onu döndür (hızlı açılış), yoksa ağı bekle
      return cached || network;
    })
  );
});
