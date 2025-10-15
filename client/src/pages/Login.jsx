import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { setUser, setUserType } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (type) => {
  setUser({ uid: "123", email: "test@example.com" });
  setUserType(type);

  // Delay navigation until React updates context
  setTimeout(() => {
    if (type === "patient") navigate("/patient");
    else if (type === "provider") navigate("/provider");
  }, 100);
};

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Login Page (Mock)</h2>
      <button onClick={() => handleLogin("patient")} style={{ marginRight: "1rem" }}>
        Login as Patient
      </button>
      <button onClick={() => handleLogin("provider")}>Login as Provider</button>
    </div>
  );
}
