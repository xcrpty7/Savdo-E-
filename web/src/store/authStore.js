import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../api/auth.api';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken });
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await authApi.register(data);
          toast.success('Registration successful!');
          return res.data;
        } catch (err) {
          const errors = err.response?.data?.errors;
          const message = err.response?.data?.message || 'Registration failed';
          if (errors?.length) {
            errors.forEach((e) => toast.error(e));
          } else {
            toast.error(message);
          }
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      googleLogin: async (credential) => {
        set({ isLoading: true });
        try {
          const res = await authApi.googleAuth(credential);
          const { user, accessToken, refreshToken } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, isLoading: false });
          toast.success(`Xush kelibsiz, ${user.name}!`);

          if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
            const params = new URLSearchParams({
              token:   accessToken,
              refresh: refreshToken,
              name:    user.name  || '',
              email:   user.email || '',
              role:    user.role  || '',
            });
            window.location.href = `${adminUrl}/sso?${params.toString()}`;
            return user;
          }

          return user;
        } catch (err) {
          set({ isLoading: false });
          const message = err.response?.data?.message || 'Google orqali kirish muvaffaqiyatsiz';
          toast.error(message);
          throw err;
        }
      },

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(credentials);
          const { user, accessToken, refreshToken } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, isLoading: false });
          toast.success(`Welcome back, ${user.name}!`);

          // ADMIN / SUPER_ADMIN — admin panelga SSO orqali yo'naltirish
          if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
            const params = new URLSearchParams({
              token:   accessToken,
              refresh: refreshToken,
              name:    user.name  || '',
              email:   user.email || '',
              role:    user.role  || '',
            });
            window.location.href = `${adminUrl}/sso?${params.toString()}`;
            return user;
          }

          return user;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          const rt = get().refreshToken || localStorage.getItem('refreshToken');
          await authApi.logout({ refreshToken: rt });
        } catch (_) {
          // ignore network errors on logout
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, accessToken: null, refreshToken: null });
          toast.success('Logged out');
        }
      },

      fetchMe: async () => {
        try {
          const res = await authApi.getMe();
          set({ user: res.data.data.user });
        } catch (_) {
          set({ user: null, accessToken: null, refreshToken: null });
        }
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      isAuthenticated: () => !!get().user,
      isAdmin: () => ['ADMIN', 'SUPER_ADMIN'].includes(get().user?.role),
    }),
    {
      name: 'savdo-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore;
