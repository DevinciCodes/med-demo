// src/pages/PrescriptionForm.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function PrescriptionForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const patient = location.state?.patient || {};

  const [formData, setFormData] = useState({
    medication: "",
    strength: "",
    DAW: "",
    instructions: "",
    dosage: "",
    quantity: "",
    refills: "",

  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Prescription submitted:", formData);
    alert("Prescription submitted!");
    navigate("/provider"); // go back to dashboard
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>New Prescription</h1>
      <form style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "400px" }} onSubmit={handleSubmit}>
        <input
          type="text"
          name="medication"
          placeholder="Drug"
          value={formData.medication}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="strength"
          placeholder="Strength"
          value={formData.strength}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="DAW"
          placeholder="DAW"
          value={formData.DAW}
          onChange={handleChange}
          required
        />
        <textarea
          name="instructions"
          placeholder="Instructions"
          value={formData.instructions}
          onChange={handleChange}
          required
          rows={4}
          style={{
            resize: "none",          // prevents dragging to resize
            width: "100%",           // fills available width
            padding: "0.5rem",
            fontFamily: "inherit",
          }}
        />
        <input
          type="text"
          name="dosage"
          placeholder="Dosage"
          value={formData.dosage}
          onChange={handleChange}
          required
        />
          <input
          type="text"
          name="quantity"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={handleChange}
          required
        />        
        <input
          type="text"
          name="refills"
          placeholder="# Refills"
          value={formData.refills}
          onChange={handleChange}
          required
        />
        <button className="login-btn" type="submit">Submit Prescription</button>
      </form>
    </div>
  );
}
