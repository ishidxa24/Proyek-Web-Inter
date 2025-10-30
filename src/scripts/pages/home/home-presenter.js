export default class HomePresenter {
  #view = null;
  #model = null;
  #token = null; // <-- 1. Tambahkan properti untuk token
  #currentPage = 1;
  #pageSize = 5;
  #hasMoreStories = true;
  #isLoading = false;

  // 2. Terima 'token' di constructor
  constructor({ view, model, token }) { 
    this.#view = view;
    this.#model = model;
    this.#token = token; // <-- 3. Simpan token yang benar
  }

  async loadInitialStories() {
    this.#currentPage = 1;
    this.#hasMoreStories = true;
    await this.#loadStories({ isInitial: true });
  }

  async loadMoreStories() {
    if (!this.#hasMoreStories || this.#isLoading) return;
    this.#currentPage += 1;
    await this.#loadStories({ isInitial: false });
  }

  async #loadStories({ isInitial }) {
    this.#isLoading = true;

    try {

      const response = await this.#model.getAllStories({
        token: this.#token, 
        page: this.#currentPage,
        size: this.#pageSize,
      });

      if (response.error) {
        throw new Error(response.message);
      }

      const stories = response.listStory || [];

      if (stories.length < this.#pageSize) {
        this.#hasMoreStories = false;
        // Panggil fungsi 'hideLoadMoreButton' jika ada di view
        if (this.#view.hideLoadMoreButton) {
           this.#view.hideLoadMoreButton();
        }
      }

      if (isInitial) {
        this.#view.showStories(stories);
      } else {
        this.#view.appendStories(stories);
      }
    } catch (error) {
      this.#view.showError(error.message);

      
    } finally {
      this.#isLoading = false;
    }
  }
}