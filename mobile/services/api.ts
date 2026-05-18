import axios from "axios";
import { useAuthStore } from "@/store/authStore";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.savdo.uz/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor — JWT token qo'shish
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — token yangilash
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        useAuthStore.getState().setToken(data.accessToken, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().clearToken();
      }
    }
    return Promise.reject(error);
  }
);
