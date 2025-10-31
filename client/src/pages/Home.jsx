// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import "../home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="navbar">
        <h1 className="home-title">PILLARS</h1>
        <p className="home-subtitle">
          Helping providers, patients, and pharmacists prevent harmful drug interactions.
        </p>
      </div>

      <div className="home-content">
        <h2>Welcome!</h2>
        <p>This is a proof-of-concept application for managing prescriptions safely.</p>
        <ul>
          <li>Patients: see prescriptions, alerts, and reminders.</li>
          <li>Providers: create and manage patient profiles and medications.</li>
          <li>Developers: access all features for testing.</li>
        </ul>

        <button
          className="login-btn"
          style={{ marginTop: "1rem" }}
          onClick={() => navigate("/login")}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}