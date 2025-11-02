import { useState } from "react";
import { updatePassword } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function ForcePasswordReset() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    const u = auth.currentUser;
    if (!u) { setErr("Not signed in."); return; }
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); return; }

    try {
      setBusy(true);
      // 1) Change auth password
      await updatePassword(u, pw);

      // 2) Flip Firestore flag (the thing Home.jsx checks)
      await updateDoc(doc(db, "Patients", u.uid), { mustReset: false });

      // 3) (Optional) If you also use a custom claim, clear it via your callable:
      //    Keep this only if you actually deployed a 'clearMustReset' function.
      try {
        const fn = httpsCallable(getFunctions(), "clearMustReset");
        await fn({});
        // Refresh token to pick up new claims
        await u.getIdToken(true);
      } catch (_) {
        // No-op if function isn't deployed; Firestore flag is sufficient
      }

      // 4) Go to the patient dashboard
      navigate(`/patients/${u.uid}`, { replace: true });
    } catch (e) {
      setErr(e?.message || "Failed to update password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ maxWidth: 420, margin: "80px auto" }}>
      <h1>Set a New Password</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {msg && <p style={{ color: "green" }}>{msg}</p>}
      <form onSubmit={submit}>
        <input
          placeholder="New password"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 12 }}
          required
        />
        <button className="login-btn" disabled={busy}>
          {busy ? "Saving..." : "Save Password"}
        </button>
      </form>
    </main>
  );
}
