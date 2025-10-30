import CONFIG from "../config";

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  NOTIFICATIONS: `${CONFIG.BASE_URL}/notifications`, 
};

export async function registerUser({ name, email, password }) {
  // (Fungsi ini sudah benar)
  try {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Register failed");
    return data;
  } catch (error) {
    return { error: true, message: error.message };
  }
}

export async function loginUser({ email, password }) {
  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Login failed");

    // --- PERBAIKAN BUG KRITERIA 1 (LOGIN LOOP) ---
    // Blok 'localStorage.setItem' yang salah DIHAPUS.
    // Ini adalah penyebab error 404/loop.
    // Penyimpanan token diurus oleh auth.js (via login-presenter.js).
    // ----------------------------------------------

    return data;
  } catch (error) {
    return { error: true, message: error.message };
  }
}

export async function getAllStories({ token, page, size, location = 0 }) {
  // (Fungsi ini sudah benar)
  try {
    if (!token) throw new Error("Token is required");
    const url = new URL(ENDPOINTS.STORIES);
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", page);
    if (size !== undefined) params.append("size", size);
    if (location !== undefined) params.append("location", location);
    url.search = params.toString();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch stories");
    return data;
  } catch (error) {
    return { error: true, message: error.message };
  }
}

export async function addStory(token, formData) {
  // (Fungsi ini sudah benar)
  try {
    const response = await fetch(ENDPOINTS.STORIES, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to add story");
    return data;
  } catch (error) {
    return { error: true, message: error.message };
  }
}

// --- PERBAIKI FUNGSI NOTIFIKASI DI BAWAH INI ---

/**
 * Mengirim data langganan (subscription) ke server API.
 */
export async function subscribeToNotifications(token, subscription) {
  // (Fungsi ini sudah benar)
  try {
    const subscriptionJson = subscription.toJSON();
    const bodyPayload = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscriptionJson.keys.p256dh,
        auth: subscriptionJson.keys.auth,
      },
    };

    const response = await fetch(`${ENDPOINTS.NOTIFICATIONS}/subscribe`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload), 
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Gagal subscribe ke notifikasi");
    return data;
  } catch (error) {
    return { error: true, message: error.message };
  }
}

/**
 * Mengirim permintaan berhenti langganan ke server API.
 */
export async function unsubscribeFromNotifications(token, subscription) {
  try {
    // --- PERBAIKAN KRITERIA 2 (CORS ERROR) ---
    // Kita kembalikan ke "POST" karena "DELETE" juga gagal (server error)
    const response = await fetch(`${ENDPOINTS.NOTIFICATIONS}/unsubscribe`, {
      method: "POST", // <-- KEMBALIKAN KE 'POST'
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    // --- AKHIR PERBAIKAN ---

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Gagal unsubscribe dari notifikasi");
    return data;
  } catch (error) {
    return { error: true, message: error.message };
  }
}