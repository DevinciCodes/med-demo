// src/pages/AdminLogin.jsx
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const navigate = useNavigate();
  const loc = useLocation();
  const redirectTo = loc.state?.from || "/admin";

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      if (remember) {
        await setPersistence(auth, browserLocalPersistence); // survive reloads
      }
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      await auth.currentUser.getIdToken(true);
      navigate(redirectTo, { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div style={pageWrap}>
      {/* 👇 Global style for white placeholders, just like ProviderRegister */}
      <style>{`
        input::placeholder {
          color: rgba(255,255,255,0.85);
        }
      `}</style>

      <div style={card}>
        <h1 style={title}>
          Admin <span style={accent}>Sign In</span>
        </h1>
        <p style={subtitle}>
          Use an account with the <code>role: "admin"</code> claim to access
          the admin dashboard.
        </p>

        {err && <div style={bannerErr}>{err}</div>}

        <form
          onSubmit={submit}
          style={{ display: "grid", gap: 12, marginTop: 8 }}
        >
          <label style={label}>
            <span>Admin email</span>
            <input
              style={input}
              placeholder="admin@institution.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label style={label}>
            <span>Password</span>
            <input
              style={input}
              placeholder="Your password"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </label>

          <label style={rememberLabel}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ marginRight: 6 }}
            />
            Remember me on this device
          </label>

          <button
            className="login-btn"
            disabled={loading}
            style={{ marginTop: 6 }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        
      </div>
    </div>
  );
}

/* ===== Shared inline styles (mirroring ProviderRegister) ===== */
const pageWrap = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
};

const card = {
  width: "100%",
  maxWidth: 520,
  background: "rgba(104, 104, 104, 0)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 16,
  boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  padding: "28px 28px 22px",
  color: "#ffffff",
  opacity: 0.85,
};

const title = {
  margin: 0,
  fontSize: 28,
  fontWeight: 800,
  letterSpacing: 0.2,
  textAlign: "center",
};

const accent = { color: "#7ca4e0" };

const subtitle = {
  marginTop: 6,
  marginBottom: 14,
  textAlign: "center",
  color: "#d4e3f3",
  fontSize: 14,
  lineHeight: 1.5,
};

const label = {
  display: "grid",
  gap: 6,
  color: "#e6eef9",
  fontSize: 12,
  fontWeight: 600,
};

const input = {
  padding: "12px 14px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.25)",
  background: "rgba(255,255,255,0.14)",
  color: "#ffffff",
  outline: "none",
  fontSize: 14,
  transition: "border-color .2s ease, background .2s ease, box-shadow .2s ease",
  boxShadow: "inset 0 0 0 9999px rgba(255,255,255,0)",
};

const bannerBase = {
  padding: "10px 12px",
  borderRadius: 10,
  fontSize: 14,
  marginBottom: 10,
};

const bannerErr = {
  ...bannerBase,
  background: "rgba(239,68,68,0.15)",
  border: "1px solid rgba(239,68,68,0.35)",
  color: "#fecaca",
};

const rememberLabel = {
  display: "flex",
  alignItems: "center",
  fontSize: 12,
  color: "#cbd5f5",
  marginTop: 2,
};
