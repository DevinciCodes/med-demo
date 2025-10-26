// src/App.jsx
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import PatientDashboard from "./pages/Patient_Dashboard";
import ProviderDashboard from "./pages/Provider_Dashboard";
import ForcePasswordReset from "./pages/ForcePasswordReset";

import Login from "./pages/Login";
import Home from "./pages/Home";

function LoadingScreen() {
  return <div style={{ padding: "2rem" }}>Loading…</div>;
}

/** /patients -> /patients/:uid (supports mock + real) */
function PatientsIndexRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  const uid =
    user?.uid ||
    (() => {
      try { return JSON.parse(localStorage.getItem("mockUser"))?.uid || null; }
      catch { return null; }
    })();

  if (!uid) return <Navigate to="/home" replace />;
  return <Navigate to={`/patients/${uid}`} replace />;
}

/** Guarded patient route at /patients/:uid */
function PatientRoute() {
  const { user, loading } = useAuth();
  const { uid } = useParams();
  if (loading) return <LoadingScreen />;

  const currentUid =
    user?.uid ||
    (() => {
      try { return JSON.parse(localStorage.getItem("mockUser"))?.uid || null; }
      catch { return null; }
    })();

  if (!currentUid) return <Navigate to="/home" replace />;
  if (uid !== currentUid) return <Navigate to={`/patients/${currentUid}`} replace />;

  return <PatientDashboard />;
}

export default function App() {
  return (
    <Routes>
      {/* Default: send root to /home */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Public pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />

      {/* Patients */}
      <Route path="/patients" element={<PatientsIndexRedirect />} />
      <Route path="/patients/:uid" element={<PatientRoute />} />

      {/* Provider (ungarded for now) */}
      <Route path="/provider" element={<ProviderDashboard />} />
      
      <Route path="/force-password-reset" element={<ForcePasswordReset />} />


      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
