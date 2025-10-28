import AddStoryPresenter from "./addStory-presenter";
import * as ApiService from "../../data/api";
import Map from "../../utils/map";
import "leaflet/dist/leaflet.css";

export default class AddStory {
  #presenter = null;
  #form = null;
  #stream = null;
  #map = null;
  #capturedImage = null;

  async render() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return `
        <section class="container">
          <h2>Tambah Cerita</h2>
          <p>Silakan login terlebih dahulu untuk mengakses fitur ini.</p>
        </section>
      `;
    }

    return `
      <section class="container fade-in">
        <h2>Tambah Cerita Baru</h2>
        <div id="notification-area" style="display: none;"></div>
        <form id="add-story-form" enctype="multipart/form-data">
          <div class="form-control">
            <label for="description">Deskripsi</label>
            <textarea id="description" name="description" placeholder="Tulis cerita Anda..." required></textarea>
          </div>
          <div class="form-control">
            <label>Ambil Gambar dari Kamera:</label><br>
            <video id="camera-stream" autoplay playsinline width="100%" aria-label="Stream kamera untuk mengambil foto"></video>
            <button type="button" id="capture-btn" class="btn">Ambil Foto</button>
            <canvas id="photo-canvas" style="display:none;" aria-label="Canvas untuk menampilkan foto hasil tangkapan kamera"></canvas>
            <label for="photo" class="mt-3 d-block">Atau pilih foto dari perangkat:</label>
            <input type="file" id="photo" name="photo" accept="image/jpeg,image/png" />
          </div>
          <div class="form-control">
            <label>
              <input type="checkbox" id="use-location" name="useLocation">
              Gunakan Lokasi Otomatis (GPS)
            </label>
          </div>
          <div class="form-control">
            <label>Pilih Lokasi Manual (Opsional):</label>
            <div id="map" style="height: 300px;"></div>
            <input type="hidden" id="lat" name="lat" />
            <input type="hidden" id="lon" name="lon" />
          </div>
          <div class="form-buttons">
            <span id="submit-button-container">
              <button type="submit" class="btn">Kirim Cerita</button>
            </span>
          </div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    const token = localStorage.getItem("access_token");
    if (!token) {
      window.location.hash = "/login";
      return;
    }

    this.#presenter = new AddStoryPresenter({ view: this, model: ApiService });
    this.#form = document.getElementById("add-story-form");
    
    this.#setupCamera();
    this.#setupMap();
    this.#addFadeInEffect();

    this.#form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const description = this.#form.description.value.trim();
      const imageFile = this.#form.photo.files[0] || this.#capturedImage;
      const useLocation = this.#form.useLocation.checked;

      if (!description || !imageFile) {
        this.#showNotification("Deskripsi dan foto wajib diisi.", "error");
        return;
      }
      if (imageFile.size > 1_000_000) {
        this.#showNotification("Ukuran foto melebihi 1MB.", "error");
        return;
      }

      let lat = document.getElementById("lat").value;
      let lon = document.getElementById("lon").value;

      if (useLocation && (!lat || !lon)) {
        try {
          const position = await Map.getCurrentPosition();
          lat = position.coords.latitude;
          lon = position.coords.longitude;
        } catch {
          this.#showNotification("Gagal mendapatkan lokasi otomatis.", "error");
        }
      }

      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", imageFile);
      if (lat && lon) {
        formData.append("lat", lat);
        formData.append("lon", lon);
      }

      await this.#presenter.submitStory(formData);
      this.#stopCamera();
    });

    window.addEventListener("beforeunload", this.#stopCamera.bind(this));
    window.addEventListener("hashchange", this.#stopCamera.bind(this));
    document.addEventListener("visibilitychange", this.#handleVisibilityChange.bind(this));
  }

  #setupCamera() {
    const video = document.getElementById("camera-stream");
    const photoInput = document.getElementById("photo");
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      this.#stream = stream;
      video.srcObject = stream;
    }).catch(() => {
      this.#showNotification("Kamera tidak tersedia. Izinkan akses kamera di browser.", "error");
    });

    document.getElementById("capture-btn").addEventListener("click", () => {
      const canvas = document.getElementById("photo-canvas");
      canvas.style.display = "block";
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob.size > 1_000_000) {
          this.#showNotification("Ukuran foto dari kamera melebihi 1MB.", "error");
          return;
        }
        this.#capturedImage = new File([blob], "capture.jpg", { type: "image/jpeg" });
        this.#showNotification("Foto berhasil diambil dari kamera.", "success");
        photoInput.value = "";
        this.#stopCamera();
        video.style.display = 'none';
      }, "image/jpeg", 0.8);
    });
  }

  async #setupMap() {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) {
      console.error("Elemen #map tidak ditemukan. Peta tidak bisa diinisialisasi.");
      this.#showNotification("Elemen peta tidak ditemukan. Coba muat ulang halaman.", "error");
      return;
    }
      
    try {
      this.#map = await Map.build("#map", {
        center: [-6.2, 106.8],
        zoom: 13,
      });

      let marker;
      this.#map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        if (marker) {
          this.#map.removeLayer(marker);
        }
        marker = this.#map.addMarker([lat, lng], {}, {
          content: `Lokasi dipilih:<br>Lat: ${lat.toFixed(5)}, Lon: ${lng.toFixed(5)}`,
        });
        marker.openPopup();
        document.getElementById("lat").value = lat;
        document.getElementById("lon").value = lng;
      });
    } catch (error) {
      console.error("Terjadi error saat memuat peta:", error);
      this.#showNotification(`Gagal memuat peta: ${error.message}`, "error");
    }
  }

  #stopCamera() {
    if (this.#stream) {
      this.#stream.getTracks().forEach((track) => track.stop());
      this.#stream = null;
    }
  }
  
  #handleVisibilityChange() {
    if (document.hidden) {
      this.#stopCamera();
    }
  }
  
  #addFadeInEffect() {
    const container = document.querySelector(".container");
    container.classList.add("fade-in");
  }
  
  #showNotification(message, type = "info") {
    const notificationArea = document.getElementById("notification-area");
    if (!notificationArea) return;
    notificationArea.textContent = message;
    notificationArea.className = `notification ${type}`;
    notificationArea.style.display = "block";
    setTimeout(() => {
      notificationArea.style.display = "none";
    }, 4000);
  }

  showSubmitSuccess(message) {
    this.#showNotification(message, "success");
    this.#form.reset();
    
    // --- INI PERBAIKANNYA ---
    // Pindah halaman setelah jeda singkat untuk menghindari error.
    setTimeout(() => {
      if ("startViewTransition" in document) {
        document.startViewTransition(() => { location.hash = "/"; });
      } else {
        location.hash = "/";
      }
    }, 100);
  }

  showSubmitError(message) {
    this.#showNotification(message, "error");
    this.hideSubmitLoadingButton();
  }
  
  showSubmitLoadingButton() {
    document.getElementById("submit-button-container").innerHTML = `
      <button type="submit" class="btn" disabled>
        <i class="fas fa-spinner loader-button"></i> Mengirim...
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById("submit-button-container").innerHTML = `
      <button type="submit" class="btn">Kirim Cerita</button>
    `;
  }
}

