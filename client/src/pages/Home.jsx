// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import "../home.css";

export default function Home() {
  const navigate = useNavigate();
  const { mock, loginMock, getMockUid } = useAuth();

  const [role, setRole] = useState(null); // "patient" | "provider" | null
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {});
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const em = email.trim();

      // ---- MOCK MODE ----
      if (mock) {
        loginMock(em, role || "patient");
        const uid =
          getMockUid?.() ||
          (() => {
            try {
              return JSON.parse(localStorage.getItem("mockUser"))?.uid;
            } catch {
              return null;
            }
          })();
        if (!uid) throw new Error("Mock login failed.");
        if (role === "provider") navigate("/provider", { replace: true });
        else navigate(`/patients/${uid}`, { replace: true });
        return;
      }

      if (!role) throw new Error("Choose Patient or Provider first.");

      // Firebase auth login
      await loginUser(em, password);
      const u = auth.currentUser;
      if (!u) throw new Error("No Firebase user after login.");

      if (role === "patient") {
        // 🔒 Must exist in Patients collection
        const snap = await getDoc(doc(db, "Patients", u.uid));
        if (!snap.exists()) {
          await signOut(auth);
          throw new Error(
            "No patient account found. Please contact your provider."
          );
        }

        const mustReset = snap.data()?.mustReset === true;

        if (mustReset) {
          navigate("/force-password-reset", { replace: true });
        } else {
          navigate(`/patients/${u.uid}`, { replace: true });
        }
      } else {
        // role === "provider"

        // 🔒 Must exist in Providers collection
        const provSnap = await getDoc(doc(db, "Providers", u.uid));
        if (!provSnap.exists()) {
          await signOut(auth);
          throw new Error(
            "No provider account found. Your account may not be registered or approved yet."
          );
        }

        // Optional: enforce approved flag if you store one
        // const data = provSnap.data();
        // if (data.approved === false) {
        //   await signOut(auth);
        //   throw new Error("Your provider account is pending approval.");
        // }

        navigate("/provider", { replace: true });
      }
    } catch (err) {
      setMessage(err?.message || "Something went wrong.");
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
            <button className="login-btn" onClick={() => setRole("patient")}>
              PATIENT LOGIN
            </button>
            <button className="login-btn" onClick={() => setRole("provider")}>
              PROVIDER LOGIN
            </button>
          </div>
        ) : (
          <>
            <div className="auth-card">
              <form className="login-form" onSubmit={handleSubmit} noValidate>
                <h2 className="login-title">{role.toUpperCase()} LOGIN</h2>

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  className="login-btn"
                  type="submit"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Signing in..." : "Login"}
                </button>

                {role === "provider" ? (
                  <p
                    className="toggle-link register-link"
                    onClick={() => navigate("/provider/register")}
                  >
                    Need a provider account? Register
                  </p>
                ) : (
                  <p className="toggle-link" style={{ opacity: 0.8 }}>
                    Patients must use credentials issued by a provider.
                  </p>
                )}

                {message && <p className="message">{message}</p>}
              </form>
            </div>

            <div style={{ marginTop: 12 }}>
              <button
                className="login-btn"
                onClick={() => {
                  setRole(null);
                  setEmail("");
                  setPassword("");
                  setMessage("");
                }}
                style={{ opacity: 0.85 }}
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
