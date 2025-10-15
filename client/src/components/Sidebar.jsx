// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom";
import "../index.css";
import "./Sidebar.css";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h2>PILLARS</h2>
      <nav className="sidebar-nav">
        
        <NavLink
          to="/patient"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Patient Dashboard
        </NavLink>
        <NavLink
          to="/provider"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Provider Dashboard
        </NavLink>
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
