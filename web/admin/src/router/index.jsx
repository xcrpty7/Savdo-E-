import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../store";
import { RoleGuard } from "../components/guards/RoleGuard";
import { AdminLayout } from "../layouts/AdminLayout";
import { LoginPage } from "../pages/auth/LoginPage";
import { SsoPage } from "../pages/auth/SsoPage";
import { AdminsPage } from "../pages/admins/AdminsPage";
import { AuditLogsPage } from "../pages/audit-logs/AuditLogsPage";
import { ContentPage } from "../pages/content/ContentPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { NotFoundPage } from "../pages/not-found/NotFoundPage";
import { ProfilePage } from "../pages/profile/ProfilePage";
import { ReportsPage } from "../pages/reports/ReportsPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { UserDetailPage } from "../pages/users/UserDetailPage";
import { UsersPage } from "../pages/users/UsersPage";
import { RolesPage } from "../pages/roles/RolesPage";
import { PermissionsPage } from "../pages/permissions/PermissionsPage";
import { ProductsPage } from "../pages/products/ProductsPage";
import { OrdersPage } from "../pages/orders/OrdersPage";
import { CustomersPage } from "../pages/customers/CustomersPage";

function RequireAuth({ children }) {
  const { isAuthenticated, auth } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = auth?.profile?.role?.toUpperCase();
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function GuestOnly({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export function AppRouter() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <BrowserRouter basename={basename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public — login */}
        <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />

        {/* SSO — web saytdan token bilan kirish */}
        <Route path="/sso" element={<SsoPage />} />

        {/* Protected admin routes */}
        <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/content" element={<ContentPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/permissions" element={<PermissionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/admins"
            element={
              <RoleGuard>
                <AdminsPage />
              </RoleGuard>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
