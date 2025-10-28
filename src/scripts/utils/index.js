export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// --- TAMBAHAN BARU DI BAWAH ---

/**
 * Mengecek apakah Service Worker didukung oleh browser
 */
export function isServiceWorkerSupported() {
  return "serviceWorker" in navigator;
}

/**
 * Mendaftarkan Service Worker
 * @param {string} swUrl - Path ke file service worker
 */
export async function registerServiceWorker(swUrl = '/sw.js') {
  if (!isServiceWorkerSupported()) {
    console.log("Service Worker tidak didukung di browser ini.");
    return;
  }

  try {
    // Kita akan gunakan swUrl dari hasil build Webpack nanti
    const registration = await navigator.serviceWorker.register(swUrl);
    console.log("Service Worker berhasil terdaftar dengan scope:", registration.scope);
  } catch (error) {
    console.error("Gagal mendaftar Service Worker:", error);
  }
}