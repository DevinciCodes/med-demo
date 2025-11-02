// src/components/RequireAdmin.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useIsAdmin } from "../hooks/useIsAdmin";

export default function RequireAdmin({ children }) {
  const { loading, isAdmin } = useIsAdmin();
  const loc = useLocation();

  if (loading) return <main style={{maxWidth:800, margin:"40px auto"}}>Loading…</main>;
  if (!isAdmin) {
    // Not admin → send to admin login, keep where we came from
    return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;
  }
  return children;
}
