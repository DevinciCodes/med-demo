// Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "../login.css";

export default function Login () {
  const navigate = useNavigate();
  const { mock, loginMock, getMockUid } = useAuth();
  
  // form state
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contact, setContact] = useState("");
  const [dob, setDob] = useState("");
  const [allergies, setAllergies] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [location, setLocation] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  
  // ui state
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [status, setStatus] = useState("idle");

  // navigate when firebase auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!mock && u) {
        navigate(`/patients/${u.uid}`, { replace: true });
      }
    });
    return () => unsub();
  }, [navigate, mock]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    setIsError(false);

    try {
      const em = email.trim();

      if (isRegister) {
        // create firebase auth user
        await registerUser(em, password);
        const u = auth.currentUser;
        if (!u) throw new Error("no firebase user after register");

        // choose collection based on role
        const col = role === "provider" ? "providers" : "patients";
        const ref = doc(db, col, u.uid);
        const snap = await getDoc(ref);

        // if no existing doc, create default profile
        if (!snap.exists()) {
          const data =
            role === "provider"
              ? {
                  firstName,
                  lastName,
                  email: em,
                  contact,
                  specialization,
                  location,
                  status: "active",
                  createdAt: serverTimestamp(),
                }
              : {
                  firstName,
                  lastName,
                  email: em,
                  dob,
                  contact,
                  allergies,
                  providerEmail: "",
                  providerId: "",
                  meds: [],
                  schedule: {},
                  status: "active",
                  createdAt: serverTimestamp(),
                };

          await setDoc(ref, data);
        }

        setIsError(false);
        setMessage("account created successfully!");
        navigate(`/${role === "provider" ? "providers" : "patients"}/${u.uid}`, {
          replace: true,
        });
      } else {
        // login
        await loginUser(em, password);
        const u = auth.currentUser;
        if (!u) throw new Error("no firebase user after login");

        setIsError(false);
        setMessage("login successful!");
        navigate(`/${role === "provider" ? "providers" : "patients"}/${u.uid}`, {
          replace: true,
        });
      }
    } catch (err) {
      setIsError(true);

      // customize error messages based on firebase error codes
      let errorMessage = "an error occurred. please try again.";

      if (err.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email. Please register first.";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. please log in instead.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setMessage(errorMessage);
      console.error(err);
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="home-container">
      {/* navbar */}
      <div className="navbar">
        <h1 className="home-title">PILLARS</h1>
        <p className="home-subtitle">
          Helping providers, patients, and pharmacists <br />
          prevent harmful drug interactions.
        </p>
      </div>

      {/* main content */}
      <div className="home-content">
        {!role ? (
          // role selection buttons
          <div className="button-group">
            <button className="login-btn" onClick={() => setRole("patient")}>
              PATIENT LOGIN
            </button>
            <button className="login-btn" onClick={() => setRole("provider")}>
              PROVIDER LOGIN
            </button>
          </div>
        ) : (
          // login/registration form
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <h2 className="form-title">
              {isRegister
                ? role === "patient"
                  ? "PATIENT REGISTRATION"
                  : "PROVIDER REGISTRATION"
                : role === "patient"
                  ? "PATIENT LOGIN"
                  : "PROVIDER LOGIN"}
            </h2>

            <div className="form-body">
              {/* login credentials */}
              <div className="form-section">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-section">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
              </div>

              {/* extra fields for registration */}
              {isRegister && (
                <>
                  <hr className="divider" />

                  {role === "patient" ? (
                    // patient registration fields
                    <div className="register-fields">
                      <h3 className="form-heading">Patient Information</h3>

                      <div className="form-row">
                        <div className="form-group">
                          <label>First Name</label>
                          <input
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Last Name</label>
                          <input
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Date of Birth</label>
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Contact Number</label>
                          <input
                            type="text"
                            placeholder="Phone Number"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Allergies</label>
                          <input
                            type="text"
                            placeholder="List allergies (comma-separated)"
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // provider registration fields
                    <div className="register-fields">
                      <h3 className="form-heading">Provider Information</h3>

                      <div className="form-row">
                        <div className="form-group">
                          <label>First Name</label>
                          <input
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Last Name</label>
                          <input
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Contact Number</label>
                          <input
                            type="text"
                            placeholder="Phone Number"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Specialization</label>
                          <input
                            type="text"
                            placeholder="e.g. Cardiology"
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Clinic / Hospital Location</label>
                        <input
                          type="text"
                          placeholder="Clinic or Hospital Name"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* submit button */}
            <button className="login-btn" type="submit" disabled={status === "loading"}>
              {status === "loading"
                ? isRegister
                  ? "Creating..."
                  : "Signing in..."
                : isRegister
                  ? "REGISTER"
                  : "LOGIN"}
            </button>

            {/* toggle between login and registration */}
            <p className="toggle-link" onClick={() => setIsRegister(!isRegister)}>
              {isRegister
                ? "Already have an account? Log in"
                : "Need an account? Register"}
            </p>

            {/* display error or success message */}
            {message && (
              <p className={isError ? "message error-msg" : "message"}>{message}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}