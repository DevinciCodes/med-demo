// src/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function ProtectedRoute() {
  const { loading, mock, user } = useAuth();

  // 1) Wait for auth to hydrate
  if (loading) return null; // or a spinner component

  // 2) In mock mode, context.user is the truth
  if (mock) return user ? <Outlet /> : <Navigate to="/login" replace />;

  // 3) In real mode, onAuthStateChanged put Firebase user in context
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
