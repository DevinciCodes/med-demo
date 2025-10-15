import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function PatientDashboard() {
  const { user, userType } = useAuth();

  if (!user || userType !== "patient") return <Navigate to="/login" />;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Patient Dashboard</h1>
      <p>Welcome, {user.email}!</p>
      <ul>
        <li>Appointment with Dr. Smith - Oct 15</li>
        <li>Appointment with Dr. Adams - Oct 20</li>
      </ul>
    </div>
  );
}
