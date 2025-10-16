// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom";
import "../index.css";
import "./Sidebar.css";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h2>PILLARS</h2>
      <nav className="sidebar-nav">
        
        {/* patient dashboard button with navigation to login, useless? */}
        <NavLink
          to="/patient"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Patient Dashboard
        </NavLink>

        {/* button with navigation to provider dashboard, irrelivent? */}
        <NavLink
          to="/provider"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Provider Dashboard
        </NavLink>
        
        {/* logout button with linked navigation to login page */}
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Logout
        </NavLink>
      </nav>
    </div>
  );
}
