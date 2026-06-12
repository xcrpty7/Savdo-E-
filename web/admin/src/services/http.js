import axios from "axios";
import { appConfig } from "../config/appConfig";

const STORAGE_KEY = "savdo-admin-auth";

export const http = axios.create({
  baseURL: appConfig.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 15000
});

// ── Request interceptor — attach token ──────────────────
http.interceptors.request.use(
  (config) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const auth = stored ? JSON.parse(stored) : null;
      if (auth?.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
      }
    } catch {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle errors + token refresh ─
http.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;

    // 401 — try token refresh (once)
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const auth = stored ? JSON.parse(stored) : null;
        if (!auth?.refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(
          `${appConfig.apiBaseUrl}/auth/refresh-token`,
          { refreshToken: auth.refreshToken }
        );

        const newToken = data.data?.accessToken || data.accessToken;
        const updated = { ...auth, token: newToken, refreshToken: data.data?.refreshToken || auth.refreshToken };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        original.headers.Authorization = `Bearer ${newToken}`;
        return http(original);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(error);
      }
    }

    // Normalize error
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Xatolik yuz berdi";

    return Promise.reject({ status: error.response?.status, message });
  }
);
