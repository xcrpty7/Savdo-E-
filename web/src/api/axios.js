import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — No longer need to manually attach token ──────────────────────
api.interceptors.request.use((config) => {
  return config;
});

// ── Response interceptor — handle 401 / refresh ───────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            // Since we use HttpOnly cookies, we don't need to manually set the header
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Cookies are sent automatically with withCredentials: true
        await axios.post(`${API_BASE}/auth/refresh-token`, {}, { withCredentials: true });

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong';
    if (status !== 401 && status !== 422) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
