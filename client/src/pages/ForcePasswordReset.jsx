// src/pages/ForcePasswordReset.jsx
import { useState } from "react";
import { updatePassword } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function ForcePasswordReset() {
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    const u = auth.currentUser;
    if (!u) {
      setErr("Not signed in.");
      return;
    }
    if (pw.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (pw !== confirmPw) {
      setErr("Passwords do not match.");
      return;
    }

    try {
      setBusy(true);

      // 1) Change auth password
      await updatePassword(u, pw);

      // 2) Flip Firestore flag (the thing Home.jsx checks)
      await updateDoc(doc(db, "Patients", u.uid), { mustReset: false });

      // 3) (Optional) Clear custom claim via callable, if deployed
      try {
        const fn = httpsCallable(getFunctions(), "clearMustReset");
        await fn({});
        // Refresh token to pick up new claims
        await u.getIdToken(true);
      } catch (_) {
        // No-op if function isn't deployed; Firestore flag is sufficient
      }

      setMsg("Password updated successfully. Redirecting to your dashboard…");

      // 4) Go to the patient dashboard
      navigate(`/patients/${u.uid}`, { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Failed to update password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={pageWrap}>
      {/* 👇 White placeholders, same as ProviderRegister/AdminLogin */}
      <style>{`
        input::placeholder {
          color: rgba(255,255,255,0.85);
        }
      `}</style>

      <div style={card}>
        <h1 style={title}>
          Update <span style={accent}>Password</span>
        </h1>
        <p style={subtitle}>
          For your security, you must set a new password before continuing to
          your dashboard.
        </p>

        {err && <div style={bannerErr}>{err}</div>}
        {msg && <div style={bannerOk}>{msg}</div>}

        <form
          onSubmit={submit}
          style={{ display: "grid", gap: 12, marginTop: 8 }}
        >
          <label style={label}>
            <span>New password</span>
            <input
              style={input}
              placeholder="Create a secure password"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
            />
          </label>

          <label style={label}>
            <span>Confirm new password</span>
            <input
              style={input}
              placeholder="Type the same password again"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
            />
          </label>

          <button
            className="login-btn"
            disabled={busy}
            style={{ marginTop: 6 }}
          >
            {busy ? "Saving..." : "Save Password"}
          </button>
        </form>

        <p style={footnote}>
          Passwords must be at least 8 characters. Using a mix of letters,
          numbers, and symbols is recommended.
        </p>
      </div>
    </div>
  );
}

/* ===== Inline styles (mirroring ProviderRegister/AdminLogin) ===== */
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

const bannerOk = {
  ...bannerBase,
  background: "rgba(34,197,94,0.15)",
  border: "1px solid rgba(34,197,94,0.35)",
  color: "#bbf7d0",
};

const bannerErr = {
  ...bannerBase,
  background: "rgba(239,68,68,0.15)",
  border: "1px solid rgba(239,68,68,0.35)",
  color: "#fecaca",
};

const footnote = {
  marginTop: 12,
  color: "#c8d7ec",
  fontSize: 13,
  textAlign: "center",
};
