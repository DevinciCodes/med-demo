// src/pages/AdminLogin.jsx
import { useState } from "react";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
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
    setErr(""); setLoading(true);
    try {
      if (remember) {
        await setPersistence(auth, browserLocalPersistence); // survive reloads
      }
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      // refresh token to pick up role claim if recently granted
      await auth.currentUser.getIdToken(true);
      navigate(redirectTo, { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ---- Dev convenience (optional): only in dev, uses Vite env ----
  const devEmail = import.meta.env.DEV ? import.meta.env.VITE_ADMIN_DEV_EMAIL : null;
  const devPass  = import.meta.env.DEV ? import.meta.env.VITE_ADMIN_DEV_PASSWORD : null;
  const devLogin = async () => {
    try {
      if (!devEmail || !devPass) throw new Error("Dev admin env not set.");
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, devEmail, devPass);
      await auth.currentUser.getIdToken(true);
      navigate("/admin", { replace: true });
    } catch (e) { setErr(e.message); }
  };

  return (
    <main style={{maxWidth:420, margin:"80px auto"}}>
      <h1>Admin Sign In</h1>
      <p style={{color:"#64748b"}}>Sign in with an account that has the <code>role: "admin"</code> claim.</p>
      {err && <p style={{color:"crimson"}}>{err}</p>}
      <form onSubmit={submit} style={{display:"grid", gap:12}}>
        <input
          placeholder="Admin email"
          type="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={pw}
          onChange={e=>setPw(e.target.value)}
        />
        <label style={{fontSize:13, color:"#334155"}}>
          <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} /> Remember me
        </label>
        <button className="login-btn" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      </form>

      {import.meta.env.DEV && (
        <div style={{marginTop:12}}>
          <button className="login-btn" onClick={devLogin} style={{opacity:0.85}}>Dev auto-login</button>
          <div style={{fontSize:12, color:"#64748b", marginTop:6}}>
            Set <code>VITE_ADMIN_DEV_EMAIL</code> and <code>VITE_ADMIN_DEV_PASSWORD</code> in <code>.env.local</code> (dev only).
          </div>
        </div>
      )}
    </main>
  );
}
