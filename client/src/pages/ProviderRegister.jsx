// src/pages/ProviderRegister.jsx
import { useState } from "react";

export default function ProviderRegister() {
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [institution, setInst] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/public/provider_register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, institution })
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("Thanks! Your account will be activated once an admin approves.");
      setFirst(""); setLast(""); setInst(""); setEmail(""); setPw("");
    } catch (e) {
      setErr(e.message || "Failed to register");
    }
  };

  return (
    <main style={{ maxWidth: 480, margin: "60px auto" }}>
      <h1>Provider Registration</h1>
      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input placeholder="First name" value={firstName} onChange={e => setFirst(e.target.value)} />
        <input placeholder="Last name" value={lastName} onChange={e => setLast(e.target.value)} />
        <input placeholder="Hospital / Institution" value={institution} onChange={e => setInst(e.target.value)} />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPw(e.target.value)} />
        <button className="login-btn">Submit</button>
      </form>
      <p style={{ marginTop: 8, color: "#64748b" }}>
        You won’t be able to sign in until an admin approves your account.
      </p>
    </main>
  );
}
