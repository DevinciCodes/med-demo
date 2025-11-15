// src/components/ProviderSidebar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import { signOut as fbSignOut } from "firebase/auth";
import "../index.css";
import "./Sidebar.css";

export default function ProviderSidebar() {
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

  const qs = new URLSearchParams(location.search);
  const currentTab = (qs.get("tab") || "overview").toLowerCase();

  const toTab = (tab) => ({
    pathname: "/provider",
    search: `?tab=${tab}`,
  });

  return (
    <div className="sidebar">
      <h2>PILLARS</h2>
      <nav className="sidebar-nav">
        <Link
          to={toTab("overview")}
          className={currentTab === "overview" ? "active" : ""}
        >
          Provider Dashboard
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

        {user && (
          <a href="/home" onClick={handleLogout}>
            Logout
          </a>
        )}
      </nav>
    </div>
  );
}
