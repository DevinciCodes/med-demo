// Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import "../home.css";

export default function Home() {
  const navigate = useNavigate();
  const { mock, loginMock, getMockUid } = useAuth(); // 👈 add getMockUid
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  // Navigate only from here when real Firebase changes.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!mock && u) {
        navigate(`/patients/${u.uid}`, { replace: true });
      }
    });
    return () => unsub();
  }, [navigate, mock]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const em = email.trim();

      if (mock) {
        // 1) update auth state first (context + localStorage)
        loginMock(em, role || "patient");
        // 2) read back the uid the same way your guard/context will
        const uid = getMockUid?.() ||
          (() => {
            try { return JSON.parse(localStorage.getItem("mockUser"))?.uid; } catch { return null; }
          })();
        if (!uid) throw new Error("Mock login failed to create uid.");

        // 3) now navigate once
        navigate(`/patients/${uid}`, { replace: true });
        return;
      }

      // REAL Firebase auth:
      if (isRegister) {
        await registerUser(em, password);
        const u = auth.currentUser;
        if (!u) throw new Error("No Firebase user after register.");
        setMessage("Account created successfully!");
        navigate(`/patients/${u.uid}`, { replace: true });
      } else {
        await loginUser(em, password);
        const u = auth.currentUser;
        if (!u) throw new Error("No Firebase user after login.");
        setMessage("Login successful!");
        navigate(`/patients/${u.uid}`, { replace: true });
      }
    } catch (err) {
      setMessage(err?.message || "Something went wrong. Please try again.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">PILLARS</h1>
        <p className="home-subtitle">
          Helping providers, patients, and pharmacists <br />
          prevent harmful drug interactions.
        </p>

        {!role ? (
          <div className="button-group">
            <button className="login-btn" onClick={() => setRole("patient")}>PATIENT LOGIN</button>
            <button className="login-btn" onClick={() => setRole("provider")}>PROVIDER LOGIN</button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <h2>{role.toUpperCase()} {isRegister ? "REGISTER" : "LOGIN"}</h2>
            <input type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <input type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} required
              autoComplete={isRegister ? "new-password" : "current-password"} />
            <button className="login-btn" type="submit" disabled={status === "loading"}>
              {status === "loading" ? (isRegister ? "Creating..." : "Signing in...") : (isRegister ? "Register" : "Login")}
            </button>
            <p className="toggle-link" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? "Already have an account? Log in" : "Need an account? Register"}
            </p>
            {message && <p className="message">{message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
