import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// 1. Caching App Shell (Kriteria 3)
precacheAndRoute(self.__WB_MANIFEST || []);

// 2. Caching Font Google (Kriteria 3)
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
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 365, maxEntries: 30 }),
    ],
  })
);

// 3. Caching Data API (Kriteria 3 - Advance)
registerRoute(
  ({ url }) => url.href.startsWith('https://story-api.dicoding.dev/v1/stories'),
  new NetworkFirst({
    cacheName: 'story-api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }), // Cache 1 hari
    ],
    networkTimeoutSeconds: 3, // Fallback ke cache setelah 3 detik
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
    icon: 'public/images/logo-192.png', // Pastikan path ikon ini benar
    badge: 'public/images/logo-192.png', // Pastikan path ikon ini benar
    data: {
      url: notificationData.data.url || '/#',
    },
    actions: [
      { action: 'explore', title: 'Buka Aplikasi' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 6. Listener untuk event 'notificationclick' (Menangani klik notifikasi)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Coba cari tab yang sudah terbuka
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);
        if (clientUrl.href === targetUrl.href && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika tidak ada, buka window baru
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});