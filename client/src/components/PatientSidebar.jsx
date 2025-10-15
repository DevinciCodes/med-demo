// src/components/PatientSidebar.jsx
import { NavLink } from "react-router-dom";
import "../index.css";
import "./PatientSidebar.css"; // reuse the same styling

export default function PatientSidebar() {
  return (
    <div className="sidebar">
      <h2>PILLARS</h2>
      <nav className="sidebar-nav">
        <NavLink
          to="/patient"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/patient/profile"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Edit Profile
        </NavLink>
        <NavLink
          to="/patient/prescriptions"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          My Prescriptions
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
