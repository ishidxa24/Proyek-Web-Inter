import BookmarkIdb from "../../data/database"; // Import logika IndexedDB

export default class BookmarkPage {
  #bookmarkListContainer = null;

  async render() {
    return `
      <section class="container fade-in" id="main-content" tabindex="-1">
        <h1 class="page-title">Cerita Tersimpan (Bookmarks)</h1>
        <p class="page-subtitle">Daftar cerita yang telah Anda simpan secara lokal.</p>
        
        <div id="bookmark-list" class="story-list bookmark-list">
          <p>Memuat bookmark...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    console.log("Halaman Bookmark berhasil di-render.");
    this.#bookmarkListContainer = document.getElementById("bookmark-list");

    if (!this.#bookmarkListContainer) {
      console.error("Elemen #bookmark-list tidak ditemukan.");
      return;
    }

    await this.#loadBookmarks();
    this.#addFadeInEffect();
  }

  /**
   * Mengambil dan menampilkan bookmark dari IndexedDB.
   */
  async #loadBookmarks() {
    try {
      const bookmarks = await BookmarkIdb.getAllBookmarks();
      this.#displayBookmarks(bookmarks);
    } catch (error) {
      console.error("Gagal memuat bookmark:", error);
      this.#bookmarkListContainer.innerHTML = '<p class="error-message">Gagal memuat bookmark. Coba lagi nanti.</p>';
    }
  }

  /**
   * Menampilkan daftar bookmark di halaman.
   * @param {Array} bookmarks - Array objek cerita dari IndexedDB.
   */
  #displayBookmarks(bookmarks) {
    if (!bookmarks || bookmarks.length === 0) {
      this.#bookmarkListContainer.innerHTML = '<p>Anda belum menyimpan bookmark cerita.</p>';
      return;
    }

    this.#bookmarkListContainer.innerHTML = bookmarks
      .map((story) => this.#generateBookmarkItem(story))
      .join("");

    // Tambahkan event listener untuk tombol hapus
    this.#bookmarkListContainer.querySelectorAll('.delete-bookmark-btn').forEach(button => {
      button.addEventListener('click', async (event) => {
        const storyId = event.target.dataset.id;
        await this.#handleDeleteBookmark(storyId, event.target);
      });
    });
  }

  /**
   * Membuat HTML untuk satu item bookmark.
   * @param {object} story - Objek cerita.
   */
  #generateBookmarkItem(story) {
    // Anda bisa menyesuaikan tampilan ini agar mirip dengan card di home-page
    return `
      <div class="story-item bookmark-item" data-story-id="${story.id}">
        ${story.photoUrl ? `<img src="${story.photoUrl}" alt="Foto cerita ${story.name || ''}" class="story-image">` : ''}
        <h3>${story.name || "Nama tidak tersedia"}</h3>
        <p>${story.description || "Deskripsi tidak tersedia"}</p>
        <p><small>Disimpan dari ID: ${story.id}</small></p>
        <button class="btn btn-danger delete-bookmark-btn" data-id="${story.id}" aria-label="Hapus bookmark untuk cerita ${story.name || ''}">
          Hapus Bookmark
        </button>
      </div>
    `;
  }

  /**
   * Menangani aksi penghapusan bookmark.
   * @param {string} storyId - ID cerita yang akan dihapus.
   * @param {HTMLElement} buttonElement - Tombol yang diklik.
   */
  async #handleDeleteBookmark(storyId, buttonElement) {
    if (!storyId) return;

    // Konfirmasi (opsional)
    const confirmation = confirm(`Anda yakin ingin menghapus bookmark untuk cerita ini (${storyId})?`);
    if (!confirmation) return;

    buttonElement.disabled = true; // Nonaktifkan tombol saat proses
    buttonElement.textContent = 'Menghapus...';

    try {
      await BookmarkIdb.deleteBookmark(storyId);
      console.log(`Bookmark ${storyId} berhasil dihapus.`);
      
      // Hapus elemen dari DOM atau muat ulang daftar
      const itemToRemove = this.#bookmarkListContainer.querySelector(`.bookmark-item[data-story-id="${storyId}"]`);
      if (itemToRemove) {
        itemToRemove.remove();
      }
      // Periksa jika daftar menjadi kosong
      if (this.#bookmarkListContainer.childElementCount === 0) {
         this.#bookmarkListContainer.innerHTML = '<p>Anda belum menyimpan bookmark cerita.</p>';
      }
      alert('Bookmark berhasil dihapus!'); // Beri notifikasi

    } catch (error) {
      console.error(`Gagal menghapus bookmark ${storyId}:`, error);
      alert('Gagal menghapus bookmark. Coba lagi nanti.');
      buttonElement.disabled = false; // Aktifkan kembali jika gagal
      buttonElement.textContent = 'Hapus Bookmark';
    }
  }

  #addFadeInEffect() {
    const container = document.querySelector(".container");
    if (container) {
      container.classList.add("fade-in");
    }
  }
}