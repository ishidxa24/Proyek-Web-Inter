// ISI FILE: src/scripts/pages/notification/notification-page.js (LENGKAP)

// 1. Import fungsi-fungsi dari helper
import {
  isPushNotificationSupported,
  requestNotificationPermission,
  subscribePushNotification,
  unsubscribePushNotification,
  getSubscriptionStatus,
} from "../../utils/notification-helper";

export default class NotificationPage {
  #toggleButton = null;
  #statusMessage = null;

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

    if (!this.#toggleButton || !this.#statusMessage) {
      console.error("Elemen tombol atau status tidak ditemukan.");
      return;
    }

    await this.#initializeToggleButton();
    this.#addFadeInEffect();
  }

  /**
   * Menginisialisasi tombol toggle: cek dukungan, status, dan tambahkan listener.
   */
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
      this.#toggleButton.disabled = false; // Aktifkan tombol setelah status diketahui
      
      this.#toggleButton.addEventListener("click", this.#handleToggleClick.bind(this));
      console.log("Tombol toggle notifikasi berhasil diinisialisasi.");
    } catch (error) {
      console.error("Gagal menginisialisasi tombol notifikasi:", error);
      this.#statusMessage.textContent = `Error: ${error.message}`;
      this.#toggleButton.textContent = "Error";
      this.#toggleButton.disabled = true;
    }
  }

  /**
   * Menangani klik pada tombol toggle.
   */
  async #handleToggleClick() {
    const isCurrentlySubscribed = this.#toggleButton.getAttribute("aria-pressed") === "true";
    this.#toggleButton.disabled = true;
    this.#statusMessage.textContent = isCurrentlySubscribed ? "Memproses berhenti langganan..." : "Memproses langganan...";

    try {
      if (isCurrentlySubscribed) {
        await unsubscribePushNotification();
        this.#updateToggleButtonUI(false);
        this.#statusMessage.textContent = "Berhasil berhenti berlangganan notifikasi.";
        console.log("Berhasil unsubscribe.");
      } else {
        // Minta izin dulu sebelum subscribe (jika belum granted)
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Izin notifikasi tidak diberikan.');
        }
        await subscribePushNotification();
        this.#updateToggleButtonUI(true);
        this.#statusMessage.textContent = "Berhasil berlangganan notifikasi.";
        console.log("Berhasil subscribe.");
      }
    } catch (error) {
      console.error("Aksi notifikasi gagal:", error);
      this.#statusMessage.textContent = `Gagal: ${error.message}`;
      // Kembalikan UI ke state sebelum error (jika perlu)
      this.#updateToggleButtonUI(isCurrentlySubscribed); 
    } finally {
      this.#toggleButton.disabled = false;
    }
  }

  /**
   * Memperbarui teks dan status aria tombol toggle.
   * @param {boolean} isSubscribed - Status langganan saat ini.
   */
  #updateToggleButtonUI(isSubscribed) {
    if (this.#toggleButton) {
      this.#toggleButton.textContent = isSubscribed ? "Nonaktifkan Notifikasi" : "Aktifkan Notifikasi";
      this.#toggleButton.setAttribute("aria-pressed", isSubscribed.toString());
    }
  }

  #addFadeInEffect() {
    // Fungsi ini bisa Anda pindahkan ke utils jika dipakai di banyak tempat
    const container = document.querySelector(".container");
    if (container) {
      // Pastikan kelas 'fade-in' ada di CSS Anda
      container.classList.add("fade-in"); 
    }
  }
}