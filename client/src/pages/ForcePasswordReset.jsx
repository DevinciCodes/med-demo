import { useState } from "react";
import { updatePassword } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function ForcePasswordReset() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    try {
      await updatePassword(auth.currentUser, pw);
      // clear the mustReset claim server-side
      const fn = httpsCallable(getFunctions(), "clearMustReset");
      await fn({});
      // refresh token to pick up new claims
      await auth.currentUser.getIdToken(true);
      navigate("/patient", { replace: true }); // or `/patients/${auth.currentUser.uid}`
    } catch (e) { setErr(e.message); }
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
        />
        <button className="login-btn">Save Password</button>
      </form>
    </main>
  );
}
