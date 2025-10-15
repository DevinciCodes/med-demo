// src/pages/Patient_Dashboard.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import "../components/Sidebar.css";

export default function PatientDashboard() {
  const { user, userType } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");

  if (!user || userType !== "patient") return <Navigate to="/login" />;

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div>
            <h2>Profile Information</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Name:</strong> John Doe</p>
            <button>Edit Profile</button>
          </div>
        );
      case "prescriptions":
        return (
          <div>
            <h2>Your Prescriptions</h2>
            <ul>
              <li>Amoxicillin 500mg — Take twice daily</li>
              <li>Lisinopril 10mg — Once daily</li>
            </ul>
          </div>
        );
      case "appointments":
        return (
          <div>
            <h2>Upcoming Appointments</h2>
            <ul>
              <li>Dr. Smith — Oct 15</li>
              <li>Dr. Adams — Oct 20</li>
            </ul>
          </div>
        );
      case "settings":
        return (
          <div>
            <h2>Settings</h2>
            <button>Change Password</button>
            <button>Logout</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>PATIENT</h2>
        <ul>
          <li
            className={activeSection === "profile" ? "active" : ""}
            onClick={() => setActiveSection("profile")}
          >
            Profile
          </li>
          <li
            className={activeSection === "prescriptions" ? "active" : ""}
            onClick={() => setActiveSection("prescriptions")}
          >
            Prescriptions
          </li>
          <li
            className={activeSection === "appointments" ? "active" : ""}
            onClick={() => setActiveSection("appointments")}
          >
            Appointments
          </li>
          <li
            className={activeSection === "settings" ? "active" : ""}
            onClick={() => setActiveSection("settings")}
          >
            Settings
          </li>
        </ul>
      </aside>

      <main className="dashboard-content">{renderContent()}</main>
    </div>
  );
}
