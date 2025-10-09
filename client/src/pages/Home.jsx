import { useState } from "react";
import "../index.css";
import AuthModal from "../components/AuthModal";

export default function Home() {
  const [role, setRole] = useState(null);

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Med<span>Match</span></h1>
        <p className="home-subtitle">
          Helping providers, patients, and pharmacists <br />
          prevent harmful drug interactions.
        </p>
        <div className="button-group">
          <button className="login-btn" onClick={() => setRole("patient")}>PATIENT LOGIN</button>
          <button className="login-btn" onClick={() => setRole("provider")}>PROVIDER LOGIN</button>
        </div>
      </div>

      {role && (
        <AuthModal
          role={role}
          onClose={() => setRole(null)}
          onSuccess={(data) => {
            console.log("Logged in:", data.user || data);
            // navigate to /patient/dashboard later if you want
          }}
        />
      )}
    </div>
  );
}
