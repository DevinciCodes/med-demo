// <<<<<<< HEAD
// import Home from "./pages/Home";

// export default function App() {
//   return <Home />;
// }

// =======
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import PatientDashboard from "./pages/Patient_Dashboard";
import ProviderDashboard from "./pages/Provider_Dashboard";
import PrescriptionForm from "./pages/PrescriptionForm";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user, userType } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public page */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />

        {/* Protected dashboards */}
        <Route
          path="/patient"
          element={user && userType === "patient" ? <PatientDashboard /> : <Navigate to="/login" />}
        />

        <Route
          path="/provider"
          element={user && userType === "provider" ? <ProviderDashboard /> : <Navigate to="/login" />}
        />
        <Route 
          path="/provider/prescription"
          element={<PrescriptionForm />} 
        />
        
        {/* Catch-all redirects */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
// >>>>>>> 8c76dcd (added provider dashboard and prescription page, bypassed firebase)
