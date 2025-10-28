// ISI FILE: src/scripts/data/database.js (LENGKAP)

import { openDB } from 'idb';

// Nama database dan object store
const DB_NAME = 'story-bookmarks-db';
const BOOKMARK_STORE_NAME = 'bookmarks';
const DB_VERSION = 1;

// Membuka atau membuat database
const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Buat object store jika belum ada
    if (!db.objectStoreNames.contains(BOOKMARK_STORE_NAME)) {
      // 'id' akan menjadi primary key
      db.createObjectStore(BOOKMARK_STORE_NAME, { keyPath: 'id' });
      console.log(`Object store '${BOOKMARK_STORE_NAME}' berhasil dibuat.`);
    }
  },
});

const BookmarkIdb = {
  /**
   * Mengambil satu bookmark berdasarkan ID
   * @param {string} id - ID cerita
   */
  async getBookmark(id) {
    if (!id) {
      console.error('ID tidak boleh kosong untuk getBookmark');
      return undefined;
    }
    const db = await dbPromise;
    return db.get(BOOKMARK_STORE_NAME, id);
  },

  /**
   * Mengambil semua bookmark
   */
  async getAllBookmarks() {
    const db = await dbPromise;
    return db.getAll(BOOKMARK_STORE_NAME);
  },

  /**
   * Menyimpan atau memperbarui bookmark (Create/Update)
   * @param {object} story - Objek cerita yang akan disimpan
   */
  async saveBookmark(story) {
    if (!story || !story.id) {
      console.error('Data cerita tidak valid untuk saveBookmark');
      return undefined;
    }
    const db = await dbPromise;
    // 'put' akan menambah jika belum ada, atau update jika sudah ada
    return db.put(BOOKMARK_STORE_NAME, story);
  },

  /**
   * Menghapus bookmark berdasarkan ID (Delete)
   * @param {string} id - ID cerita
   */
  async deleteBookmark(id) {
    if (!id) {
      console.error('ID tidak boleh kosong untuk deleteBookmark');
      return undefined;
    }
    const db = await dbPromise;
    return db.delete(BOOKMARK_STORE_NAME, id);
  },
};

export default BookmarkIdb;