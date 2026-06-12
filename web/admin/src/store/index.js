import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { authApi } from "../services/api/auth.api";

const STORAGE_KEY = "savdo-admin-auth";

const ALL_PERMISSIONS = [
  "dashboard.view",
  "users.view", "users.create", "users.update", "users.delete",
  "content.view", "content.create", "content.update", "content.delete",
  "reports.view", "reports.export",
  "audit_logs.view",
  "settings.view", "settings.manage",
  "profile.view", "profile.update",
  "admins.manage"
];

function buildProfile(user) {
  const isPrimary = user.role === "SUPER_ADMIN";
  const initials = (user.name || user.email || "AD").slice(0, 2).toUpperCase();

  return {
    id: user._id || user.id,
    name: user.name || "Admin",
    email: user.email,
    role: user.role?.toLowerCase() || "admin",
    isPrimary,
    avatar: initials,
    permissions: ALL_PERMISSIONS,
    status: "active",
    lastLogin: { type: "today_at", time: new Date().toTimeString().slice(0, 5) }
  };
}

function getStoredAuth() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (auth) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [auth]);

  useEffect(() => {
    const handle = () => setAuth(null);
    window.addEventListener("auth:logout", handle);
    return () => window.removeEventListener("auth:logout", handle);
  }, []);

  const value = useMemo(
    () => ({
      auth,
      profile: auth?.profile ?? null,
      isAuthenticated: Boolean(auth?.token),

      login: async (credentials) => {
        const res = await authApi.login(credentials);
        const { user, accessToken, refreshToken } = res.data;
        const profile = buildProfile(user);
        const nextAuth = { token: accessToken, refreshToken, profile };
        setAuth(nextAuth);
        return nextAuth;
      },

      updateProfile: (changes) =>
        setAuth((curr) =>
          curr ? { ...curr, profile: { ...curr.profile, ...changes } } : curr
        ),

      logout: async () => {
        try {
          if (auth?.refreshToken) await authApi.logout();
        } catch { /* ignore */ }
        setAuth(null);
      },

      hasPermission: (permission) =>
        Boolean(auth?.profile?.permissions?.includes(permission))
    }),
    [auth]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
