import axios from 'axios';
import { API_BASE } from '../constants/api';
import { getToken, clearAll } from '../store/authStore';

let navigationRef = null;

export const setNavigationRef = (ref) => {
  navigationRef = ref;
};

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — inject token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await clearAll();
      if (navigationRef && navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
