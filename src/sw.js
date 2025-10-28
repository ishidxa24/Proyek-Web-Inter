// ISI FILE: src/sw.js (LENGKAP FINAL)

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// 1. Caching App Shell (Otomatis oleh Webpack via InjectManifest)
// Ini membuat aplikasi Anda bisa dimuat offline (Kriteria 3)
precacheAndRoute(self.__WB_MANIFEST || []);

// 2. Caching Font Google (Opsional tapi bagus untuk Kriteria 3)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
);
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 365, maxEntries: 30 }), // Cache 1 tahun
    ],
  })
);

// 3. Caching Data API (Kriteria 3 - Advance)
registerRoute(
  // Cocokkan URL API cerita
  ({ url }) => url.href.startsWith('https://story-api.dicoding.dev/v1/stories'),
  new NetworkFirst({
    cacheName: 'story-api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }), // Hanya cache respons OK
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }), // Cache 1 hari
    ],
    // TAMBAHAN: Batasi waktu tunggu jaringan sebelum fallback ke cache
    networkTimeoutSeconds: 3,
  })
);

// 4. Caching Gambar API (Kriteria 3 - Advance)
registerRoute(
  ({ request, url }) => request.destination === 'image' && url.origin === 'https://story-api.dicoding.dev',
  new CacheFirst({
    cacheName: 'story-image-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }), // Cache 30 hari
    ],
  })
);

// --- Kriteria 2: Logika Push Notification ---

// 5. Listener untuk event 'push' (Menampilkan notifikasi)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (e) {
    // Fallback jika data bukan JSON
    notificationData = {
      title: 'Notifikasi Baru',
      body: event.data.text(),
      data: { url: '/#' } // Default URL jika tidak ada
    };
  }

  const title = notificationData.title || 'Story App';
  const options = {
    body: notificationData.body || 'Ada konten baru untuk Anda.',
    // Pastikan path ikon ini benar setelah build
    icon: 'public/images/logo-192.png',
    badge: 'public/images/logo-192.png',
    data: {
      // URL yang akan dibuka saat notifikasi diklik
      url: notificationData.data.url || '/#',
    },
    // Tombol action pada notifikasi
    actions: [
      { action: 'explore', title: 'Buka Aplikasi' }
    ]
  };

  // Tampilkan notifikasi
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 6. Listener untuk event 'notificationclick' (Menangani klik notifikasi)
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Tutup notifikasi

  // Ambil URL dari data notifikasi
  const urlToOpen = event.notification.data.url;

  // Buka window baru atau fokus ke tab yang sudah ada
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true // Termasuk klien yang belum dikontrol SW
    }).then((clientList) => {
      // Coba cari tab yang sudah terbuka dengan URL yang sama
      for (const client of clientList) {
        // Gunakan new URL() untuk perbandingan yang lebih baik
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin); // Buat URL absolut
        if (clientUrl.href === targetUrl.href && 'focus' in client) {
          return client.focus(); // Fokus ke tab yang sudah ada
        }
      }
      // Jika tidak ada tab yang cocok, buka window baru
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});