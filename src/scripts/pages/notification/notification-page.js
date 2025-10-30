import {
  isPushNotificationSupported,
  subscribePushNotification,
  unsubscribePushNotification,
  getSubscriptionStatus,
} from "../../utils/notification-helper";
// 1. IMPORT FUNGSI UNTUK MENGAMBIL TOKEN
import { getAccessToken } from "../../utils/auth"; 

export default class NotificationPage {
  #toggleButton = null;
  #statusMessage = null;
  #token = null; // 2. Tambahkan properti untuk menyimpan token

  async render() {
    return `
      <section class="container fade-in" id="main-content" tabindex="-1">
        <h1 class="page-title">Pengaturan Notifikasi</h1>
        <p class="page-subtitle">Aktifkan atau nonaktifkan notifikasi push di perangkat Anda.</p>
        
        <div class="notification-toggle-container">
          <label for="notification-toggle" class="notification-toggle-label">
            Langganan Notifikasi Push
          </label>
          <button id="notification-toggle" class="btn" aria-pressed="false" disabled>
            Memuat...
          </button>
        </div>
        <p id="notification-status" class="notification-status-message"></p>
      </section>
    `;
  }

  async afterRender() {
    console.log("Halaman Notifikasi: afterRender dimulai.");
    this.#toggleButton = document.getElementById("notification-toggle");
    this.#statusMessage = document.getElementById("notification-status");
    
    // 3. Ambil dan simpan token saat halaman dimuat
    this.#token = getAccessToken(); 

    if (!this.#toggleButton || !this.#statusMessage) {
      console.error("Elemen tombol atau status tidak ditemukan.");
      return;
    }
    
    // Cek jika pengguna login
    if (!this.#token) {
        this.#statusMessage.textContent = "Anda harus login untuk mengatur notifikasi.";
        this.#toggleButton.disabled = true;
        this.#toggleButton.textContent = "Login Diperlukan";
        return;
    }

    await this.#initializeToggleButton();
    this.#addFadeInEffect();
  }

  async #initializeToggleButton() {
    if (!isPushNotificationSupported()) {
      this.#statusMessage.textContent = "Notifikasi Push tidak didukung di browser ini.";
      this.#toggleButton.disabled = true;
      this.#toggleButton.textContent = "Tidak Didukung";
      return;
    }

    try {
      const isSubscribed = await getSubscriptionStatus();
      this.#updateToggleButtonUI(isSubscribed);
      this.#toggleButton.disabled = false;
      
      this.#toggleButton.addEventListener("click", this.#handleToggleClick.bind(this));
      console.log("Tombol toggle notifikasi berhasil diinisialisasi.");
    } catch (error) {
      console.error("Gagal menginisialisasi tombol notifikasi:", error);
      this.#statusMessage.textContent = `Error: ${error.message}`;
      this.#toggleButton.textContent = "Error";
      this.#toggleButton.disabled = true;
    }
  }

  async #handleToggleClick() {
    const isCurrentlySubscribed = this.#toggleButton.getAttribute("aria-pressed") === "true";
    this.#toggleButton.disabled = true;
    this.#statusMessage.textContent = isCurrentlySubscribed ? "Memproses berhenti langganan..." : "Memproses langganan...";

    try {
      if (isCurrentlySubscribed) {
        // 4. Kirim token saat unsubscribe
        await unsubscribePushNotification(this.#token); 
        this.#updateToggleButtonUI(false);
        this.#statusMessage.textContent = "Berhasil berhenti berlangganan notifikasi.";
        console.log("Berhasil unsubscribe.");
      } else {
        // Minta izin dulu (browser prompt)
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Izin notifikasi tidak diberikan.');
        }
        
        // 5. Kirim token saat subscribe
        await subscribePushNotification(this.#token); 
        this.#updateToggleButtonUI(true);
        this.#statusMessage.textContent = "Berhasil berlangganan notifikasi.";
        console.log("Berhasil subscribe.");
      }
    } catch (error) {
      console.error("Aksi notifikasi gagal:", error);
      this.#statusMessage.textContent = `Gagal: ${error.message}`;
      this.#updateToggleButtonUI(isCurrentlySubscribed); 
    } finally {
      this.#toggleButton.disabled = false;
    }
  }

  #updateToggleButtonUI(isSubscribed) {
    if (this.#toggleButton) {
      this.#toggleButton.textContent = isSubscribed ? "Nonaktifkan Notifikasi" : "Aktifkan Notifikasi";
      this.#toggleButton.setAttribute("aria-pressed", isSubscribed.toString());
    }
  }

  #addFadeInEffect() {
    const container = document.querySelector(".container");
    if (container) {
      container.classList.add("fade-in"); 
    }
  }
}