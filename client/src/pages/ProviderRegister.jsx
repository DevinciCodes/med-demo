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
        body: JSON.stringify({ firstName, lastName, email, password, institution }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("Thanks! Your account will be activated once an admin approves.");
      setFirst(""); setLast(""); setInst(""); setEmail(""); setPw("");
    } catch (e) {
      setErr(e.message || "Failed to register");
    }
  };

  return (
    <div style={pageWrap}>
      {/* 👇 Global style for white placeholders */}
      <style>{`
        input::placeholder {
          color: rgba(255,255,255,0.85);
        }
      `}</style>

      <div style={card}>
        <h1 style={title}>
          Provider <span style={accent}>Registration</span>
        </h1>
        <p style={subtitle}>
          Register your healthcare institution to begin managing patient profiles.
        </p>

        {msg && <div style={bannerOk}>{msg}</div>}
        {err && <div style={bannerErr}>{err}</div>}

        <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 8 }}>
          <label style={label}>
            <span>First name</span>
            <input
              style={input}
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirst(e.target.value)}
            />
          </label>

          <label style={label}>
            <span>Last name</span>
            <input
              style={input}
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLast(e.target.value)}
            />
          </label>

          <label style={label}>
            <span>Hospital / Clinic / Institution</span>
            <input
              style={input}
              placeholder="e.g., Vanderbuilt Medical Center"
              value={institution}
              onChange={(e) => setInst(e.target.value)}
            />
          </label>

          <label style={label}>
            <span>Email</span>
            <input
              style={input}
              type="email"
              placeholder="name@institution.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label style={label}>
            <span>Password</span>
            <input
              style={input}
              type="password"
              placeholder="Create a secure password"
              value={password}
              onChange={(e) => setPw(e.target.value)}
            />
          </label>

          <button type="submit" className="login-btn" style={{ marginTop: 6 }}>
            Submit
          </button>
        </form>

        <p style={footnote}>
          You won’t be able to sign in until an admin approves your account.
        </p>
      </div>
    </div>
  );
}

/* ===== Inline styles ===== */
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
