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
  const { user, userType, signOut: ctxSignOut } = useAuth() || {};

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

  // Build patient base path only if we have a user
  const patientBase = user ? `/patients/${user.uid}` : "/home";

  // Parse current ?tab= from URL for active highlight on patient tabs
  const qs = new URLSearchParams(location.search);
  const currentTab = (qs.get("tab") || "overview").toLowerCase();

  const toTab = (tab) => ({
    pathname: patientBase,
    search: `?tab=${tab}`,
  });

  // Role-aware menu
  const isPatient = userType === "patient";
  const isProvider = userType === "provider";

  return (
    <div className="sidebar">
      <h2>PILLARS</h2>
      <nav className="sidebar-nav">
        {/* PATIENT MENU */}
        {isPatient && (
          <>
            {/* Main Dashboard (Overview) */}
            <NavLink
              to={toTab("overview")}
              className={({ isActive }) =>
                isActive && currentTab === "overview" ? "active" : ""
              }
              end
            >
              Patient Dashboard
            </NavLink>

            <Link
              to={toTab("meds")}
              className={currentTab === "meds" ? "active" : ""}
            >
              Medications
            </Link>

            <Link
              to={toTab("alerts")}
              className={currentTab === "alerts" ? "active" : ""}
            >
              Alerts
            </Link>

            <Link
              to={toTab("settings")}
              className={currentTab === "settings" ? "active" : ""}
            >
              Settings
            </Link>
          </>
        )}

        {/* PROVIDER MENU */}
        {isProvider && (
          <NavLink
            to="/provider"
            className={({ isActive }) => (isActive ? "active" : "")}
            end
          >
            Provider Dashboard
          </NavLink>
        )}

        {/* FALLBACK (unauth/unknown role) */}
        {!isPatient && !isProvider && (
          <>
            <NavLink
              to="/home"
              className={({ isActive }) => (isActive ? "active" : "")}
              end
            >
              Home
            </NavLink>
            <NavLink
              to="/home"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Login
            </NavLink>
          </>
        )}

        {/* Logout (only show if signed in) */}
        {user && (
          <a href="/home" onClick={handleLogout}>
            Logout
          </a>
        )}
      </nav>
    </div>
  );
}
