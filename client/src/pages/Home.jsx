import { useState } from "react";
import { loginUser, registerUser } from "../firebase";
import "../index.css";

export default function Home() {
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await registerUser(email, password);
        setMessage("Account created successfully!");
      } else {
        await loginUser(email, password);
        setMessage("Login successful!");
      }
    } catch (err) {
      setMessage(err.message);
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
            <button className="login-btn" onClick={() => setRole("provider")}>PROVIDER LOGIN
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>{role.toUpperCase()} LOGIN</h2>
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

            <button className="login-btn" type="submit">{isRegister ? "Register" : "Login"}</button>

            <p
              className="toggle-link"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister
                ? "Already have an account? Log in"
                : "Need an account? Register"}
            </p>
            {message && <p className="message">{message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}