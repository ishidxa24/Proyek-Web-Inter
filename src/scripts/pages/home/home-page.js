import HomePresenter from "./home-presenter";
import * as ApiService from "../../data/api";
// 1. IMPORT LOGIKA DATABASE
import BookmarkIdb from "../../data/database"; 
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 2. IMPORT KEY TOKEN YANG BENAR (Untuk perbaikan bug sebelumnya)
import { ACCESS_TOKEN_KEY } from "../../config";

export default class HomePage {
  #presenter = null;
  #map = null;
  #markers = [];
  #stories = []; // <-- Tambahkan ini untuk menyimpan data cerita

  async render() {
    // 3. GUNAKAN KEY TOKEN YANG BENAR
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    const skipLink = `<a href="#first-story" class="skip-to-content">Skip to main content</a>`;

    if (!token) {
      return `
        ${skipLink}
        <section class="container fade-in" id="main-content" tabindex="-1">
          <h1>Home Page</h1>
          <p>Tolong login dahulu.</p>
        </section>
      `;
    }

    return `
      ${skipLink}
      <section class="container fade-in" id="main-content" tabindex="-1">
        <div class="header-bar">
          <h1>Home Page</h1>
        <div id="map" style="height: 400px; margin-bottom: 20px;"></div>
        <div class="story-list-wrapper">
          <div id="stories-list" class="story-list">Loading stories...</div>
          <div style="margin-top: 1rem;">
            <button id="loadMoreBtn" class="load-more-btn" aria-label="Muat lebih banyak story">Load More</button>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // 4. GUNAKAN KEY TOKEN YANG BENAR
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      window.location.hash = "#/login"; // Perbaiki redirect ke #/login
      return;
    }

    // Listener tombol logout (Sudah benar TAPI gunakan key yang benar)
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        // 5. GUNAKAN KEY TOKEN YANG BENAR saat logout
        localStorage.removeItem(ACCESS_TOKEN_KEY); 
        localStorage.removeItem("user_id"); 
        window.location.hash = "#/login"; // Perbaiki redirect ke #/login
      });
    }

    try {
      this.#presenter = new HomePresenter({
        view: this,
        model: ApiService,
        token: token, // <-- Pastikan ini sudah diperbaiki
      });

      await this.initialMap();
      // Panggil loadInitialStories DULU baru attach handler
      await this.#presenter.loadInitialStories(); 
      this.#addFadeInEffect();
      
      // 6. PANGGIL FUNGSI UNTUK MENAMBAH LISTENER TOMBOL SAVE
      this.#attachSaveButtonsHandler(); 

      const loadMoreBtn = document.getElementById("loadMoreBtn");
      loadMoreBtn?.addEventListener("click", () => {
        this.#presenter.loadMoreStories();
      });

      // Listener klik story item (sudah benar)
      document.addEventListener("click", (e) => {
        const storyItem = e.target.closest(".story-item");
        if (storyItem) {
          const lat = parseFloat(storyItem.dataset.lat);
          const lng = parseFloat(storyItem.dataset.lng);
          const storyId = storyItem.dataset.storyId;
          if (!isNaN(lat) && !isNaN(lng)) {
            this.#focusMapToStory(lat, lng, storyId);
          }
        }
      });
    } catch (error) {
      this.showError(error.message);
    }
  }

  async initialMap() {
    // ... (Fungsi ini sudah benar) ...
    this.#map = L.map("map").setView([-2.5489, 118.0149], 5);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(this.#map);

    this.#map.on("click", (e) => {
      const coordinate = e.latlng;
      this.#addMarker({
        coordinate: [coordinate.lat, coordinate.lng],
        title: "Lokasi Baru",
        description: "Lokasi dipilih!",
        isCurrentUser: true,
      });
    });
  }

  showStories(stories) {
    // 7. Simpan data cerita ke properti #stories
    this.#stories = stories; 
    
    const container = document.getElementById("stories-list");
    const currentUserId = String(localStorage.getItem("user_id"));

    if (!stories || stories.length === 0) {
      container.innerHTML = "<p>Tidak ada story tersedia.</p>";
      return;
    }

    this.#markers.forEach((marker) => marker.remove());
    this.#markers = [];

    container.innerHTML = stories
      .map((story, index) => this.#generateStoryItem(story, currentUserId, index))
      .join("");

    this.#addMarkersFromStories(stories, currentUserId);
    
    // 8. Panggil ulang attach handler setelah render awal
    this.#attachSaveButtonsHandler(); 
  }

  appendStories(stories) {
    // 9. Tambahkan cerita baru ke properti #stories
    this.#stories.push(...stories); 

    const container = document.getElementById("stories-list");
    const currentUserId = String(localStorage.getItem("user_id"));

    if (!stories || stories.length === 0) return;

    const newContent = stories
      .map((story) => this.#generateStoryItem(story, currentUserId))
      .join("");

    container.insertAdjacentHTML("beforeend", newContent);
    this.#addMarkersFromStories(stories, currentUserId);
    
    // 10. Panggil ulang attach handler setelah append
    this.#attachSaveButtonsHandler(); 
  }

  #generateStoryItem(story, currentUserId, index = -1) {
    const storyUserId = String(story.userId || (story.user && story.user.id));
    const isCurrentUser = storyUserId === currentUserId;
    const lat = story.lat || "";
    const lon = story.lon || "";

    return `
      <div 
        class="story-item ${isCurrentUser ? "my-story" : "other-story"}"
        ${index === 0 ? 'id="first-story" tabindex="0"' : ""}
        data-story-id="${story.id}"
        data-lat="${lat}"
        data-lng="${lon}"
      >
        <img src="${story.photoUrl}" alt="Foto cerita" class="story-image">
        <h3>${story.name || "Nama tidak tersedia"}</h3>
        <p>${story.description || "Deskripsi tidak tersedia"}</p>
        <p><strong>Dibuat pada:</strong> ${new Date(
          story.createdAt
        ).toLocaleString("id-ID", {
          dateStyle: "full",
          timeStyle: "short",
        })}</p>
        ${lat && lon ? `<p><strong>Lokasi:</strong> ${lat}, ${lon}</p>` : ""}
        
        <button class="btn save-story-btn" data-id="${story.id}" aria-label="Simpan cerita ${story.name || ''}">
          Save Story
        </button>
      </div>`;
  }

  // 12. FUNGSI BARU UNTUK MENAMBAH EVENT LISTENER TOMBOL SAVE
  #attachSaveButtonsHandler() {
    const buttons = document.querySelectorAll(".save-story-btn");
    buttons.forEach((btn) => {
      // Hapus listener lama (jika ada) untuk mencegah duplikasi
      btn.replaceWith(btn.cloneNode(true));
    });
    
    // Tambahkan listener baru ke tombol yang baru di-clone
    document.querySelectorAll(".save-story-btn").forEach((btn) => {
        btn.addEventListener('click', async (event) => {
          const id = event.target.getAttribute("data-id");
          if (!this.#stories || this.#stories.length === 0) {
              console.error('Data #stories kosong, tidak bisa menyimpan bookmark.');
              alert('Data cerita tidak tersedia untuk disimpan.');
              return;
          }
          // Cari cerita dari data yang disimpan di #stories
          const storyToSave = this.#stories.find((s) => String(s.id) === id);

          if (!storyToSave) {
            alert("Cerita tidak ditemukan untuk disimpan.");
            return;
          }

          event.target.disabled = true; // Nonaktifkan tombol sementara
          event.target.textContent = 'Menyimpan...';

          try {
            await BookmarkIdb.saveBookmark(storyToSave);
            alert("Cerita berhasil disimpan ke bookmark!");
            event.target.textContent = 'Tersimpan'; // Ubah teks tombol
          } catch (error) {
            alert("Gagal menyimpan cerita: " + error.message);
            event.target.disabled = false; // Aktifkan lagi jika gagal
            event.target.textContent = 'Save Story';
          }
        });
    });
  }


  #addMarkersFromStories(stories, currentUserId) {
    // ... (Fungsi ini sudah benar) ...
      stories.forEach((story) => {
      const lat = story.lat || (story.location && story.location.latitude);
      const lon = story.lon || (story.location && story.location.longitude);
      const storyUserId = String(story.userId || (story.user && story.user.id));
      const isCurrentUser = storyUserId === currentUserId;

      if (lat && lon) {
        this.#addMarker({
          coordinate: [parseFloat(lat), parseFloat(lon)],
          title: story.name || "Tidak ada judul",
          description: story.description || "Tidak ada deskripsi",
          photoUrl: story.photoUrl,
          isCurrentUser,
          id: story.id,
        });
      }
    });

    if (this.#markers.length > 0) {
      const group = L.featureGroup(this.#markers);
      this.#map.fitBounds(group.getBounds());
    }
  }

  #addMarker({ coordinate, title, description, photoUrl = null, isCurrentUser = false, id = null }) {
    // ... (Fungsi ini sudah benar) ...
    const icon = L.icon({
      iconUrl: isCurrentUser
        ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png"
        : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      shadowSize: [41, 41],
      shadowAnchor: [12, 41],
    });

    const popupContent = `
      <div class="marker-popup" style="max-width: 200px;">
        <h4 class="marker-title" style="margin: 0 0 8px 0; color: ${isCurrentUser ? "#2563eb" : "#dc2626"}">${title}</h4>
        ${photoUrl ? `<img src="${photoUrl}" alt="Foto cerita" style="width: 100%; border-radius: 4px; margin: 8px 0;" />` : ""}
        <p style="margin: 8px 0;">${description}</p>
        <p style="margin: 4px 0; font-size: 0.875rem; color: ${isCurrentUser ? "#2563eb" : "#dc2626"}">
          <strong>${isCurrentUser ? "Story Saya" : "Story User"}</strong>
        </p>
      </div>
    `;

    const marker = L.marker(coordinate, { icon }).bindPopup(popupContent).addTo(this.#map);
    if (id) marker.storyId = id;
    this.#markers.push(marker);
  }

  #focusMapToStory(lat, lng, storyId) {
    // ... (Fungsi ini sudah benar) ...
    if (!this.#map) return;

    document.getElementById("map").scrollIntoView({ behavior: "smooth" });
    this.#map.setView([lat, lng], 14);

    const marker = this.#markers.find((m) => m.storyId === storyId);
    if (marker) marker.openPopup();
  }

  showError(message) {
    const container = document.getElementById("stories-list");
    container.innerHTML = `<p class="error-message">Error: ${message}</p>`;

    // 13. GUNAKAN KEY TOKEN YANG BENAR
    if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
      localStorage.removeItem(ACCESS_TOKEN_KEY); 
      setTimeout(() => {
        window.location.hash = "#/login"; // Perbaiki redirect ke #/login
      }, 2000);
    }
  }

  #addFadeInEffect() {
    // ... (Fungsi ini sudah benar) ...
    const container = document.querySelector(".container");
    if (container) {
      container.classList.add("fade-in");
    }
  }
}