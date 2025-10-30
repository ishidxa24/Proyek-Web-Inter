// ISI FILE: src/scripts/utils/notification-helper.js (LENGKAP)

// 1. IMPORT VAPID KEY (pastikan config.js ada di ../config)
import { VAPID_PUBLIC_KEY } from "../config"; 
// 2. IMPORT API SERVICE (pastikan api.js ada di ../data/api.js)
import * as ApiService from '../data/api';
// 3. IMPORT FUNGSI AUTENTIKASI (pastikan auth.js ada di ./auth.js)
import { getAccessToken } from './auth';

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
  const token = getAccessToken(); // Ambil token saat fungsi dipanggil
  if (!isPushNotificationSupported()) {
    throw new Error("Push Notification tidak didukung di browser ini.");
  }
  if (!token) {
    throw new Error("Token autentikasi diperlukan untuk subscribe.");
  }

  // Minta izin (jika belum)
  await requestNotificationPermission();

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  
  // Jika belum subscribe, buat subscription baru
  if (!subscription) {
    console.log("Membuat langganan baru...");
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  // --- PERBAIKAN DI SINI ---
  // KIRIM SUBSCRIPTION KE SERVER API
  console.log("Mengirim langganan ke server...");
  const response = await ApiService.subscribeToNotifications(token, subscription);
  
  if (response.error) {
    // Jika gagal kirim ke server, batalkan subscription di browser
    await subscription.unsubscribe();
    throw new Error(response.message);
  }
  // --- AKHIR PERBAIKAN ---

  console.log("Berhasil subscribe ke server:", response);
  return subscription;
}

/**
 * Berhenti berlangganan (unsubscribe) dari push notification
 */
export async function unsubscribePushNotification() {
  const token = getAccessToken(); // Ambil token saat fungsi dipanggil
  if (!token) {
    throw new Error("Token autentikasi diperlukan untuk unsubscribe.");
  }
  
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    // --- PERBAIKAN DI SINI ---
    // KIRIM PERMINTAAN UNSUBSCRIBE KE SERVER API
    console.log("Mengirim permintaan unsubscribe ke server...");
    const response = await ApiService.unsubscribeFromNotifications(token, subscription);
    
    if (response.error) {
      // Jika server gagal, jangan hapus subscription lokal
      throw new Error(response.message);
    }
    
    // Hapus subscription dari browser HANYA JIKA server berhasil
    await subscription.unsubscribe();
    // --- AKHIR PERBAIKAN ---
    
    console.log("Berhasil unsubscribe dari server:", response);
    return subscription;
  }

  console.log("Tidak ada langganan untuk di-unsubscribe.");
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