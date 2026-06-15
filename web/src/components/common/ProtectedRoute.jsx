import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export function ProtectedRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export function GuestRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (accessToken) return <Navigate to="/dashboard" replace />;
  return children;
}
