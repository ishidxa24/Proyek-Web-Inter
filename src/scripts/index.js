import "../styles/styles.css";
import "leaflet/dist/leaflet.css";

import App from "./pages/app";
import { getAccessToken } from "./utils/auth";
// 1. IMPORT FUNGSI UNTUK MEREGISTRASI SERVICE WORKER
import { registerServiceWorker } from "./utils/index"; 

const token = getAccessToken();
const url = location.hash;

if (!location.hash || location.hash === "#") {
  location.hash = getAccessToken() ? "#/" : "#/login";
}

const app = new App({
  content: document.querySelector("#main-content"),
  drawerButton: document.querySelector("#drawer-button"),
  // 2. PERBAIKI ID NAVBAR AGAR SESUAI DENGAN index.html
  navigationDrawer: document.querySelector("#navbar"), 
});

window.addEventListener("hashchange", () => {
  app.renderPage();
});

// 3. UBAH 'load' MENJADI ASYNC DAN TAMBAHKAN REGISTRASI SW
window.addEventListener("load", async () => {
  // Daftarkan Service Worker
  await registerServiceWorker('./sw.js'); // Kita akan konfigurasikan path 'sw.js' ini di Webpack
  
  // Render halaman setelah SW siap
  app.renderPage();
});