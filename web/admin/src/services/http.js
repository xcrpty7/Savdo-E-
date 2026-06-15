import axios from "axios";
import { appConfig } from "../config/appConfig";

const STORAGE_KEY = "savdo-admin-auth";

export const http = axios.create({
  baseURL: appConfig.apiBaseUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 15000
});

// ── Request interceptor — No longer need to manually attach token ──────────────────
http.interceptors.request.use(
  (config) => {
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
        // Cookies are sent automatically with withCredentials: true (if configured in axios.create)
        // But let's ensure the base axios call for refresh is correct
        await axios.post(
          `${appConfig.apiBaseUrl}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        return http(original);
      } catch {
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
