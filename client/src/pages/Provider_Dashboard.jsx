import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

// fake patient info for testing
const mockPatients = [
  { id: "p1", name: "John Doe", email: "john.doe@example.com", dob: "1990-01-15", phone: "111-111-1111", addr:"3920 Lakeview Drive, Austin, TX 78745" },
  { id: "p2", name: "Jane Smith", email: "jane.smith@example.com", dob: "1985-07-22", phone: "098-765-4321", addr:"5871 Maplewood Avenue, Columbus, OH 43214" },
  { id: "p3", name: "Alice Johnson", email: "alice.johnson@example.com", dob: "2000-03-10", phone: "123-456-7890", addr:"1248 Evergreen Terrace, Springfield, IL 62704" },
];

export default function ProviderDashboard() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const filtered = mockPatients.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    setResults(filtered);
  };

  const handleNewPrescription = () => {
    if (!selectedPatient) return;
    navigate("/provider/prescription", { state: { patient: selectedPatient } });
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "220px", padding: "2rem", flex: 1 }}>
        <h1>Provider Dashboard</h1>

        {/* Patient Lookup */}
        <div style={{ marginBottom: "1rem" }}>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search patients by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "0.5rem", width: "300px", marginRight: "0.5rem" }}
            />
            <button type="submit" className="login-btn">
              Search
            </button>
          </form>

          {results.length > 0 && (
            <ul style={{ marginTop: "0.5rem" }}>
              {results.map((p) => (
                <li key={p.id} style={{ marginBottom: "0.25rem" }}>
                  {p.name} - DOB: {p.dob}{" "}
                  <button
                    className="login-btn"
                    style={{ marginLeft: "0.5rem", padding: "0.25rem 0.5rem" }}
                    onClick={() => setSelectedPatient(p)}
                  >
                    View Profile
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Selected Patient Profile */}
        {selectedPatient && (
          <div
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              maxWidth: "400px",
            }}
          >
            <h3>Patient Profile</h3>
            <p><strong>Name:</strong> {selectedPatient.name}</p>
            <p><strong>Email:</strong> {selectedPatient.email}</p>
            <p><strong>Date of Birth:</strong> {selectedPatient.dob}</p>
            <p><strong>Phone Number:</strong> {selectedPatient.phone}</p>
            <p><strong>Address:</strong> {selectedPatient.addr}</p>

            {/* New Prescription button inside profile */}
            <button
              className="login-btn"
              style={{ marginTop: "0.5rem" }}
              onClick={() => handleNewPrescription()}
            >
              New Prescription
            </button>

            <button
              className="login-btn"
              style={{ marginTop: "0.5rem", marginLeft: "0.5rem" }}
              onClick={() => setSelectedPatient(null)}
            >
              Close Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
