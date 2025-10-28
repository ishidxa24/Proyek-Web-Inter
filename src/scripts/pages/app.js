import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
// 1. IMPORT FUNGSI AUTENTIKASI YANG BENAR
import { getAccessToken, removeAccessToken, ACCESS_TOKEN_KEY } from "../utils/auth"; 

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._setupLogout(); // Panggil setupLogout
  }

  _setupDrawer() {
    if (!this.#drawerButton || !this.#navigationDrawer) return;

    // Buka/tutup drawer dengan tombol hamburger
    this.#drawerButton.addEventListener("click", (event) => {
       event.stopPropagation(); // Hentikan event agar tidak langsung ditutup oleh listener body
       this.#navigationDrawer.classList.toggle("open");
    });

    // Tutup drawer jika klik di luar atau link di dalam drawer
     document.body.addEventListener("click", (event) => {
       const navDrawer = this.#navigationDrawer;
       const drawerBtn = this.#drawerButton;

       // Hanya proses jika drawer ada dan terbuka
       if (navDrawer && navDrawer.classList.contains('open')) {
           // Tutup jika klik di luar drawer dan bukan tombol hamburger
           if (drawerBtn && !navDrawer.contains(event.target) && !drawerBtn.contains(event.target)) {
             navDrawer.classList.remove("open");
           }
           // Tutup jika link di dalam drawer diklik
           else if (navDrawer.contains(event.target) && event.target.closest('a')) {
              navDrawer.classList.remove("open");
           }
       }
     });
  }


  _setupLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", () => {
      // 2. GUNAKAN FUNGSI DAN KEY YANG BENAR UNTUK LOGOUT
      removeAccessToken(); // Hapus token dengan fungsi yang benar
      localStorage.removeItem("user_id"); // Hapus user_id jika masih dipakai
      
      // Update navbar SEBELUM redirect
      this._updateNavbarVisibility(false); 
      
      // Redirect ke login dengan format HASH yang benar
      window.location.hash = "#/login"; // Gunakan #/login
    });
  }

  // 3. FUNGSI BARU UNTUK MENGATUR VISIBILITAS NAVBAR
  _updateNavbarVisibility(isLogin) {
    const navItemsLoggedIn = [
      document.getElementById("nav-beranda"),
      document.getElementById("nav-tambah"),
      document.getElementById("nav-notifikasi"),
      document.getElementById("nav-bookmark"),
      document.getElementById("nav-about"),
      document.getElementById("nav-logout"), // Ini adalah <li> pembungkus tombol logout
    ];
    const navItemsLoggedOut = [
      document.getElementById("nav-login"),
      document.getElementById("nav-register"),
    ];

    if (isLogin) {
      // Tampilkan item untuk logged in, sembunyikan item untuk logged out
      navItemsLoggedIn.forEach(item => item?.classList.remove('hidden'));
      navItemsLoggedOut.forEach(item => item?.classList.add('hidden'));
    } else {
      // Sembunyikan item untuk logged in, tampilkan item untuk logged out
      navItemsLoggedIn.forEach(item => item?.classList.add('hidden'));
      navItemsLoggedOut.forEach(item => item?.classList.remove('hidden'));
    }
     // Pastikan drawer tertutup saat status login berubah (misalnya saat logout)
    if (this.#navigationDrawer) {
        this.#navigationDrawer.classList.remove('open');
    }
  }

  async renderPage() {
    // 4. GUNAKAN FUNGSI getAccessToken YANG BENAR
    const isLogin = !!getAccessToken(); 
    const url = getActiveRoute(); // Dapatkan rute ('/' atau '/login', dll)

    // Panggil fungsi untuk update navbar berdasarkan status login
    this._updateNavbarVisibility(isLogin);

    // Dapatkan halaman yang sesuai dari routes.js
    let pageLoader = routes[url];
    
    // Jika tidak ada rute pasti, cek fallback atau handle 404
    if (!pageLoader) {
        console.warn(`Rute tidak ditemukan: ${url}`);
        // Arahkan ke beranda jika login, atau login jika tidak
        location.hash = isLogin ? "#/" : "#/login"; 
        return;
    }

    // Jika pageLoader adalah fungsi (untuk rute dinamis atau checkAuth), panggil
    let page = typeof pageLoader === "function" ? pageLoader() : pageLoader;

    // Jika halaman null setelah checkAuth (misalnya akses halaman login saat sudah login)
    if (!page) {
       console.warn(`Halaman tidak bisa dimuat untuk rute: ${url}. Mungkin karena checkAuth gagal/redirect.`);
       // Redirect sudah dihandle oleh checkAuth, tidak perlu redirect lagi di sini
       return;
    }

    // Render halaman ke dalam #main-content
    try {
        this.#content.innerHTML = await page.render();
        // Pastikan afterRender ada dan merupakan fungsi sebelum dipanggil
        if (page.afterRender && typeof page.afterRender === 'function') {
           await page.afterRender();
        } else {
           console.warn(`Metode afterRender tidak ditemukan atau bukan fungsi di halaman untuk rute: ${url}`);
        }
    } catch (error) {
       console.error(`Error saat merender atau afterRender halaman ${url}:`, error);
       this.#content.innerHTML = `<p class="error-message">Terjadi kesalahan saat memuat halaman.</p>`;
    }
  }
}

export default App;