// src/pages/Login.jsx
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  // Supports both setups:
  // - mock helpers: loginMock, mock
  // - legacy setters: setUser, setUserType
  const { loginMock, mock, setUser, setUserType } = useAuth() || {};
  const navigate = useNavigate();

  const handleLogin = (type) => {
    let uid;
    if (mock && typeof loginMock === "function") {
      // Use loginMock; it stores the mock user in localStorage
      const email = type === "provider" ? "provider@example.com" : "patient@example.com";
      loginMock(email, type);
      uid = (() => {
        try { return JSON.parse(localStorage.getItem("mockUser"))?.uid; } catch { return null; }
      })();
    } else if (typeof setUser === "function" && typeof setUserType === "function") {
      // Legacy mock path using your existing setters
      uid = "123"; // or whatever you want for your dev UID
      setUser({ uid, email: "test@example.com" });
      setUserType(type);
    } else {
      // No mock available? Send to Home to use real login
      navigate("/home", { replace: true });
      return;
    }

    if (type === "provider") {
      navigate("/provider", { replace: true });
    } else {
      // patient → /patients/:uid
      navigate(`/patients/${uid}`, { replace: true });
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Login Page (Mock)</h2>
      <button onClick={() => handleLogin("patient")} style={{ marginRight: "1rem" }}>
        Login as Patient
      </button>
      <button onClick={() => handleLogin("provider")}>Login as Provider</button>
    </div>
  );
}
