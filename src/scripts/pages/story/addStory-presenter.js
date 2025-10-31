export default class AddStoryPresenter {
  #view;
  #model;
  #token; // <-- 1. Tambahkan properti untuk token

  // 2. Terima 'token' di constructor
  constructor({ view, model, token }) { 
    this.#view = view;
    this.#model = model;
    this.#token = token; // <-- 3. Simpan token yang benar
  }

  async submitStory(formData) {
    this.#view.showSubmitLoadingButton();

    try {
      // 4. HAPUS LOGIKA 'getItem("access_token")' YANG SALAH
      // Pengecekan token sudah diurus oleh 'view' (add-story.js)
      // if (!token) ...

      // 5. Gunakan 'this.#token' (token yang benar)
      const response = await this.#model.addStory(this.#token, formData); 

      if (response.error) {
        throw new Error(response.message || "Gagal mengirim cerita.");
      }

      this.#view.showSubmitSuccess(
        response.message || "Cerita berhasil dikirim."
      );
    } catch (error) {
      this.#view.showSubmitError(error.message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}