export default class HomePresenter {
  #view = null;
  #model = null;
  #currentPage = 1;
  #pageSize = 5;
  #hasMoreStories = true;
  #isLoading = false;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
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
      const token = localStorage.getItem("access_token");

      if (!token) {
        this.#view.showError("Tolong login dahulu");
        window.location.hash = "/login";
        return;
      }

      const response = await this.#model.getAllStories({
        token,
        page: this.#currentPage,
        size: this.#pageSize,
      });

      if (response.error) {
        throw new Error(response.message);
      }

      const stories = response.listStory || [];

      if (stories.length < this.#pageSize) {
        this.#hasMoreStories = false;
        this.#view.hideLoadMoreButton();
      }

      if (isInitial) {
        this.#view.showStories(stories);
      } else {
        this.#view.appendStories(stories);
      }
    } catch (error) {
      this.#view.showError(error.message);

      if (
        error.message.includes("401") ||
        error.message.toLowerCase().includes("unauthorized")
      ) {
        localStorage.removeItem("access_token");
        window.location.hash = "/login";
      }
    } finally {
      this.#isLoading = false;
    }
  }
}
