// src/components/Sidebar.jsx
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import { signOut as fbSignOut } from "firebase/auth";
import "../index.css";
import "./Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut: ctxSignOut } = useAuth() || {};

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      if (typeof ctxSignOut === "function") {
        await ctxSignOut();
      } else {
        await fbSignOut(auth);
      }
    } finally {
      navigate("/home", { replace: true });
    }
  };

  // Base: /patients/:uid (or /home if no user)
  const patientBase = user ? `/patients/${user.uid}` : "/home";

  // Read ?tab=... from URL
  const qs = new URLSearchParams(location.search);
  const currentTab = (qs.get("tab") || "overview").toLowerCase();

  const toTab = (tab) => ({
    pathname: patientBase,
    search: `?tab=${tab}`,
  });

  return (
    <div className="sidebar">
      <h2>PILLARS</h2>
      <nav className="sidebar-nav">
        {/* Main Dashboard NavLink */}
        <NavLink
          to={toTab("overview")}
          className={({ isActive }) =>
            isActive && currentTab === "overview" ? "active" : ""
          }
          end
        >
          Overview
        </NavLink>

        {/* Tab links using Link */}
        

        <Link to={toTab("meds")} className={currentTab === "meds" ? "active" : ""}>
          Medications
        </Link>

        <Link to={toTab("alerts")} className={currentTab === "alerts" ? "active" : ""}>
          Alerts
        </Link>

        <Link to={toTab("settings")} className={currentTab === "settings" ? "active" : ""}>
          Settings
        </Link>

        {/* Provider Dashboard NavLink */}
        <NavLink
          to="/provider"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Provider Dashboard
        </NavLink>

        {/* Logout */}
        <a href="/home" onClick={handleLogout}>
          Logout
        </a>
      </nav>
    </div>
  );
}
