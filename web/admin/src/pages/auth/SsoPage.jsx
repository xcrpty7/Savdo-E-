import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../store";

const STORAGE_KEY = "savdo-admin-auth";

function buildProfile(user) {
  const isPrimary = user.role === "SUPER_ADMIN";
  const initials = (user.name || user.email || "AD").slice(0, 2).toUpperCase();
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
  return {
    id: user.id,
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

export function SsoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token    = searchParams.get("token");
    const refresh  = searchParams.get("refresh");
    const name     = searchParams.get("name");
    const email    = searchParams.get("email");
    const role     = searchParams.get("role");

    // Parametrlar to'g'ri va rol admin bo'lsa — saqlab dashboard ga o'tamiz
    if (token && email && ["ADMIN", "SUPER_ADMIN"].includes(role)) {
      const auth = {
        token,
        refreshToken: refresh || "",
        profile: buildProfile({ id: "", name, email, role }),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
      // Sahifa to'liq qayta yuklanadi — AuthProvider yangi holat o'qiydi
      window.location.replace("/dashboard");
    } else if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", flexDirection: "column", gap: 16,
      background: "#0f172a", color: "#fff", fontFamily: "sans-serif"
    }}>
      <div style={{
        width: 40, height: 40, border: "4px solid #6366f1",
        borderTopColor: "transparent", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <p style={{ color: "#94a3b8", fontSize: 14 }}>Admin panelga o'tilmoqda...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
