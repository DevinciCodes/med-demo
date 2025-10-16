import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

// Mock patient data
const mockPatients = [
  { 
    id: "p1", 
    name: "John Doe", 
    gender: "Male", 
    email: "john.doe@example.com", 
    dob: "1990-01-15", 
    phone: "111-111-1111", 
    addr: "3920 Lakeview Drive, Austin, TX 78745", 
    allergy: "None" 
  },
  { 
    id: "p2", 
    name: "Jane Smith", 
    gender: "Female", 
    email: "jane.smith@example.com", 
    dob: "1985-07-22", 
    phone: "098-765-4321", 
    addr: "5871 Maplewood Avenue, Columbus, OH 43214", 
    allergy: [
      { allergen: "Codeine", reaction: "Hives" },
      { allergen: "Latex", reaction: "Skin Rash" }
    ]
  },
  { 
    id: "p3", 
    name: "Alice Johnson", 
    gender: "Female", 
    email: "alice.johnson@example.com", 
    dob: "2000-03-10", 
    phone: "123-456-7890", 
    addr: "1248 Evergreen Terrace, Springfield, IL 62704", 
    allergy: [
      { allergen: "Penicillin", reaction: "Anaphylaxis" }
    ]
  },
];

export default function ProviderDashboard() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAllergies, setShowAllergies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState(null);
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

  const toggleAllergies = () => {
    setShowAllergies((prev) => !prev);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedPatient({ 
      ...selectedPatient, 
      allergy: selectedPatient.allergy === "None" ? [] : [...selectedPatient.allergy] 
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const updated = { ...editedPatient };
    if (Array.isArray(updated.allergy) && updated.allergy.length === 0) {
      updated.allergy = "None";
    }
    setSelectedPatient(updated);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedPatient(null);
  };

  // Allergy Editing Handlers
  const handleAllergyChange = (index, field, value) => {
    const updatedAllergies = [...editedPatient.allergy];
    updatedAllergies[index][field] = value;
    setEditedPatient((prev) => ({ ...prev, allergy: updatedAllergies }));
  };

  const handleAddAllergy = () => {
    const newAllergy = { allergen: "", reaction: "" };
    setEditedPatient((prev) => ({
      ...prev,
      allergy: Array.isArray(prev.allergy)
        ? [...prev.allergy, newAllergy]
        : [newAllergy],
    }));
  };

  const handleRemoveAllergy = (index) => {
    const updated = editedPatient.allergy.filter((_, i) => i !== index);
    setEditedPatient((prev) => ({ ...prev, allergy: updated }));
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div
        style={{
          marginLeft: "220px",
          padding: "2rem",
          flex: 1,
          maxHeight: "100vh",   // limits container to viewport height
          overflowY: "auto",    // scrolls vertically if content is too tall
        }}
      >
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
                    onClick={() => {
                      setSelectedPatient(p);
                      setShowAllergies(false);
                      setIsEditing(false);
                    }}
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
              maxWidth: "480px",
            }}
          >
            <h3>Patient Profile</h3>

            {!isEditing ? (
              <>
                <p><strong>Name:</strong> {selectedPatient.name}</p>
                <p><strong>Gender:</strong> {selectedPatient.gender}</p>
                <p><strong>Date of Birth:</strong> {selectedPatient.dob}</p>
                <p><strong>Phone Number:</strong> {selectedPatient.phone}</p>
                <p><strong>Email:</strong> {selectedPatient.email}</p>
                <p><strong>Address:</strong> {selectedPatient.addr}</p>
              </>
            ) : (
              <>
                <label><strong>Name:</strong></label>
                <input name="name" value={editedPatient.name} onChange={handleChange} style={{ width: "100%", marginBottom: "0.5rem" }} />

                <label><strong>Gender:</strong></label>
                <input name="gender" value={editedPatient.gender} onChange={handleChange} style={{ width: "100%", marginBottom: "0.5rem" }} />

                <label><strong>Date of Birth:</strong></label>
                <input type="date" name="dob" value={editedPatient.dob} onChange={handleChange} style={{ width: "100%", marginBottom: "0.5rem" }} />

                <label><strong>Phone:</strong></label>
                <input name="phone" value={editedPatient.phone} onChange={handleChange} style={{ width: "100%", marginBottom: "0.5rem" }} />

                <label><strong>Email:</strong></label>
                <input name="email" value={editedPatient.email} onChange={handleChange} style={{ width: "100%", marginBottom: "0.5rem" }} />

                <label><strong>Address:</strong></label>
                <input name="addr" value={editedPatient.addr} onChange={handleChange} style={{ width: "100%", marginBottom: "0.5rem" }} />

                {/* Editable Allergies */}
                <div style={{ marginTop: "1rem" }}>
                  <strong>Allergies:</strong>
                  {editedPatient.allergy.length === 0 ? (
                    <p>No allergies listed.</p>
                  ) : (
                    editedPatient.allergy.map((a, index) => (
                      <div key={index} style={{ marginBottom: "0.5rem", background: "#f5f5f5", padding: "0.5rem", borderRadius: "5px" }}>
                        <input
                          type="text"
                          placeholder="Allergen"
                          value={a.allergen}
                          onChange={(e) => handleAllergyChange(index, "allergen", e.target.value)}
                          style={{ width: "45%", marginRight: "0.5rem" }}
                        />
                        <input
                          type="text"
                          placeholder="Reaction"
                          value={a.reaction}
                          onChange={(e) => handleAllergyChange(index, "reaction", e.target.value)}
                          style={{ width: "45%", marginRight: "0.5rem" }}
                        />
                        <button className="login-btn" style={{ padding: "0.25rem 0.5rem" }} onClick={() => handleRemoveAllergy(index)}>
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                  <button className="login-btn" onClick={handleAddAllergy}>
                    Add Allergy
                  </button>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <button className="login-btn" onClick={handleSave}>Save</button>
                  <button className="login-btn" style={{ marginLeft: "0.5rem" }} onClick={handleCancel}>Cancel</button>
                </div>
              </>
            )}

            {/* Allergies dropdown when NOT editing */}
            {!isEditing && (
              <div style={{ marginTop: "1rem" }}>
                <strong>Allergies:</strong>{" "}
                {selectedPatient.allergy === "None" ? (
                  <span>None</span>
                ) : (
                  <>
                    <button
                      className="login-btn"
                      style={{ marginLeft: "0.5rem", padding: "0.25rem 0.5rem" }}
                      onClick={toggleAllergies}
                    >
                      {showAllergies ? "Hide Allergies" : "View Allergies"}
                    </button>

                    {showAllergies && Array.isArray(selectedPatient.allergy) && (
                      <ul
                        style={{
                          marginTop: "0.5rem",
                          background: "#2c3e50",
                          border: "1px solid #ddd",
                          borderRadius: "5px",
                          padding: "0.5rem 1rem",
                          listStyleType: "none",
                          color: "white",
                        }}
                      >
                        {selectedPatient.allergy.map((a, i) => (
                          <li key={i} style={{ marginBottom: "0.25rem" }}>
                            <strong>{a.allergen}</strong> — {a.reaction}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {!isEditing && (
              <div style={{ marginTop: "1rem" }}>
                <button className="login-btn" onClick={handleEdit}>Edit Profile</button>
                <button className="login-btn" style={{ marginLeft: "0.5rem" }} onClick={handleNewPrescription}>New Prescription</button>
                <button className="login-btn" style={{ marginLeft: "0.5rem" }} onClick={() => setSelectedPatient(null)}>Close Profile</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
