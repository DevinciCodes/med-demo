// src/components/AuthModal.jsx
import { useState } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function AuthModal({ role = "patient", onClose, onSuccess }) {
  const [mode, setMode] = useState("signin"); // 'signin' | 'register'
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e) {
    e.preventDefault();
    setMsg(""); setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = form.get("email");
    const password = form.get("password");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess?.(); onClose();
    } catch (err) {
      setMsg(err.message);
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setMsg(""); setLoading(true);
    const form = new FormData(e.currentTarget);
    const name = form.get("name");
    const email = form.get("email");
    const password = form.get("password");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      // create a user profile doc
      await setDoc(doc(db, "users", uid), {
        name, email, role,
        createdAt: serverTimestamp(),
      });
      setMsg("Registered successfully. Please sign in.");
      setMode("signin");
    } catch (err) {
      setMsg(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>
          {mode === "signin" ? `Sign in as ${role}` : `Create ${role} account`}
        </h3>

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} style={{ display: "grid", gap: 10 }}>
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: "grid", gap: 10 }}>
            <input name="name" placeholder="Full name" required />
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password (min 6)" minLength={6} required />
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>
        )}

        {msg && <p style={{ color: "#b00020", marginTop: 10 }}>{msg}</p>}

        <div style={{ marginTop: 12, fontSize: 14 }}>
          {mode === "signin" ? (
            <>Not signed up?{" "}
              <button onClick={() => setMode("register")} style={linkBtn}>Register</button>
            </>
          ) : (
            <>Have an account?{" "}
              <button onClick={() => setMode("signin")} style={linkBtn}>Sign in</button>
            </>
          )}
        </div>

        <div style={{ marginTop: 10 }}>
          <button className="login-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

const linkBtn = {
  background: "none",
  border: "none",
  color: "#1a2b44",
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "underline",
};
