// ISI FILE: src/scripts/utils/notification-helper.js (LENGKAP)

// Import VAPID key dari config.js
// Sesuaikan path-nya jika config.js ada di luar utils
import { VAPID_PUBLIC_KEY } from "../config"; 

/**
 * Mengubah string VAPID public key (Base64) menjadi Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Memeriksa apakah browser mendukung Service Worker dan Push Manager
 */
export function isPushNotificationSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * Meminta izin notifikasi kepada pengguna
 */
export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Izin notifikasi tidak diberikan.");
  }
  return permission;
}

/**
 * Mendaftarkan (subscribe) perangkat ke push notification server
 */
export async function subscribePushNotification() {
  if (!isPushNotificationSupported()) {
    throw new Error("Push Notification tidak didukung di browser ini.");
  }

  await requestNotificationPermission();

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Kirim subscription ke server Anda (jika diperlukan)
  // await ApiService.subscribeNotification(getAccessToken(), subscription);

  console.log("Berhasil subscribe:", subscription);
  return subscription;
}

/**
 * Berhenti berlangganan (unsubscribe) dari push notification
 */
export async function unsubscribePushNotification() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    // Kirim info unsubscribe ke server Anda (jika diperlukan)
    // await ApiService.unsubscribeNotification(getAccessToken(), subscription.endpoint);
    
    await subscription.unsubscribe();
    console.log("Berhasil unsubscribe:", subscription);
    return subscription;
  }

  return null;
}

/**
 * Mengecek status langganan saat ini
 */
export async function getSubscriptionStatus() {
  if (!isPushNotificationSupported()) {
    return false;
  }
  
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription; // Mengembalikan true jika ada langganan, false jika tidak
}