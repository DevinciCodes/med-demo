// src/pages/ProviderDashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { db, auth } from "../firebase"; // 👈 make sure this exists and exports Firestore + Auth
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// ===== Your original mock data (unchanged for search) =====
const mockPatients = [
  { id: "p1", name: "John Doe", email: "john.doe@example.com", dob: "01-15-1990", phone: "111-111-1111", addr:"3920 Lakeview Drive, Austin, TX 78745" },
  { id: "p2", name: "Jane Smith", email: "jane.smith@example.com", dob: "07-22-1985", phone: "098-765-4321", addr:"5871 Maplewood Avenue, Columbus, OH 43214" },
  { id: "p3", name: "Alice Johnson", email: "alice.johnson@example.com", dob: "03-10-2000", phone: "123-456-7890", addr:"1248 Evergreen Terrace, Springfield, IL 62704" },
];

// ===== Small UI helpers (inline styles) =====
const container   = { maxWidth: 960, margin: "0 auto" };
const pageWrap    = { marginLeft: "220px", padding: "2rem", flex: 1, background: "#f8fafc", minHeight: "100vh", color: "#0f172a" };
const card        = { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, color: "#0f172a" };
const cardHeader  = { marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" };
const h1          = { fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: 0.2, color: "#0f172a" };
const h2          = { fontSize: 18, fontWeight: 600, margin: 0, color: "#0f172a" };
const muted       = { color: "#64748b" };
const labelStyle  = { display: "block", fontSize: 12, color: "#475569", marginBottom: 6 };
const input       = { padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, outline: "none", fontSize: 14, width: "100%", background: "#fff", color: "#0f172a" };
const row2        = { display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" };
const row3        = { display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" };
const buttonBase  = { padding: "10px 14px", borderRadius: 10, border: "1px solid transparent", cursor: "pointer", fontWeight: 600 };
const btnPrimary  = { ...buttonBase, background: "#4176c6", color: "#fff" }; // solid hex
const btnGhost    = { ...buttonBase, background: "#f8fafc", color: "#0f172a", border: "1px solid #e5e7eb" };
const bannerOk    = { margin: "12px 0", padding: 12, borderRadius: 10, border: "1px solid #a7f3d0", background: "#ecfdf5", color: "#065f46" };
const bannerErr   = { margin: "12px 0", padding: 12, borderRadius: 10, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b" };
// const badge    = { padding: "2px 8px", borderRadius: 999, background: "#eef2ff", color: "#3730a3", fontSize: 12, fontWeight: 600 };

function genTempPassword() {
  const base = Math.random().toString(36).slice(-6);
  return "Temp!" + base;
}

export default function ProviderDashboard() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const navigate = useNavigate();

  // ===== Create Patient (collapsible) =====
  const [showCreate, setShowCreate] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [tempCreds, setTempCreds] = useState(null);

  // Split name fields + other profile info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [dob, setDob]             = useState("");
  const [allergies, setAllergies] = useState("");
  const [contact, setContact]     = useState("");

  // Initial meds (array of rows)
  const [meds, setMeds] = useState([
    { name: "", dosage: "", frequency: "", route: "", kind: "rx", notes: "" },
  ]);

  // Simple schedule block
  const [nextVisit, setNextVisit] = useState(""); // e.g., "2025-11-05T14:30"
  const [visitReason, setVisitReason] = useState("");
  const [visitLocation, setVisitLocation] = useState("");

  // ===== Keep YOUR search function exactly as-is =====
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

  // Med rows controls
  const addMedRow = () => setMeds((rows) => [...rows, { name: "", dosage: "", frequency: "", route: "", kind: "rx", notes: "" }]);
  const removeMedRow = (i) => setMeds((rows) => rows.length === 1 ? rows : rows.filter((_, idx) => idx !== i));
  const updateMed = (i, field, value) => setMeds((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const copyCreds = async () => {
    if (!tempCreds) return;
    const txt = `Patient Portal (demo)\nEmail: ${tempCreds.email}\nTemp Password: ${tempCreds.tempPassword}`;
    try { await navigator.clipboard.writeText(txt); setMsg("Credentials copied to clipboard."); }
    catch { setErr("Could not copy to clipboard."); }
  };

  // ===== Create Patient: Firestore write =====
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setMsg(""); setErr(""); setTempCreds(null);

    if (!firstName || !lastName || !email) {
      setErr("First name, Last name, DOB, and email are required.");
      return;
    }

    // (Demo) temp password for portal — creating an actual Auth user would require Admin SDK on a server.
    const tempPassword = genTempPassword();

    try {
      const provider = auth.currentUser;
      const providerId = provider?.uid || null;
      const providerEmail = provider?.email || null;

      const payload = {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        dob: dob || "",
        allergies: allergies || "",
        contact: contact || "",
        providerId,
        providerEmail,
        createdAt: serverTimestamp(),
        // meds entered during creation
        meds: meds
          .filter((m) => m.name.trim())
          .map((m) => ({
            name: m.name.trim(),
            dosage: m.dosage.trim(),
            frequency: m.frequency.trim(),
            route: m.route.trim(),
            kind: (m.kind || "rx").trim(), // 'rx' | 'otc'
            notes: m.notes.trim(),
            createdAt: serverTimestamp(),
            createdBy: providerId,
          })),
        // basic schedule
        schedule: {
          nextVisit: nextVisit || "",
          reason: visitReason || "",
          location: visitLocation || "",
        },
        // store demo temp password so you can share it; replace with real Auth signup later
        tempPassword,
        status: "active",
      };

      const ref = await addDoc(collection(db, "Patients"), payload);

      // Update UI
      setMsg("Patient created in Firebase.");
      setTempCreds({ email, tempPassword });

      // (Optional) Make it searchable immediately with your current mock-based search:
      mockPatients.unshift({
        id: ref.id,
        name: `${firstName} ${lastName}`,
        email,
        dob,
        phone: contact,
        addr: contact,
      });

      // Reset fields & collapse
      setFirstName(""); setLastName(""); setEmail(""); setDob("");
      setAllergies(""); setContact("");
      setMeds([{ name: "", dosage: "", frequency: "", route: "", kind: "rx", notes: "" }]);
      setNextVisit(""); setVisitReason(""); setVisitLocation("");
      setShowCreate(false);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={pageWrap}>
        <div style={container}>
          {/* Header */}
          <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h1 style={h1}>Provider Dashboard</h1>
              <div style={{ ...muted, fontSize: 14 }}>Create patient, add initial meds & schedule, then manage.</div>
            </div>
            <button style={btnPrimary} onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? "Close" : "Create Patient"}
            </button>
          </div>

          {/* Banners */}
          {msg && <div style={bannerOk}>{msg}</div>}
          {err && <div style={bannerErr}>{err}</div>}
          {tempCreds && (
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={cardHeader}>
                <h2 style={h2}>Temporary Patient Portal Credentials (demo)</h2>
              </div>
              <div style={{ lineHeight: 1.9 }}>
                <div>Email: <code style={{ color: "#0f172a" }}>{tempCreds.email}</code></div>
                <div>Temp Password: <code style={{ color: "#0f172a" }}>{tempCreds.tempPassword}</code></div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  For a real portal, create the Auth user via a backend with Firebase Admin SDK and force a password reset on first login.
                </div>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button style={btnGhost} onClick={copyCreds}>Copy</button>
              </div>
            </div>
          )}

          {/* Create Patient (collapsible) */}
          {showCreate && (
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={cardHeader}><h2 style={h2}>New Patient</h2></div>

              {/* Patient identity */}
              <form onSubmit={handleCreatePatient} style={{ display: "grid", gap: 16 }}>
                <div style={row2}>
                  <div>
                    <label style={labelStyle}>First Name *</label>
                    <input style={input} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name *</label>
                    <input style={input} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Patient" />
                  </div>
                </div>

                <div style={row2}>
                  <div>
                    <label style={labelStyle}>Email (login) *</label>
                    <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane.patient@example.com" />
                  </div>
                  <div>
                    <label style={labelStyle}>DOB *</label>
                    <input style={input} type="text" value={dob} onChange={(e) => setDob(e.target.value)} placeholder="YYYY-MM-DD" />
                  </div>
                </div>

                <div style={row2}>
                  <div>
                    <label style={labelStyle}>Allergies</label>
                    <input style={input} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="penicillin, peanuts" />
                  </div>
                  <div>
                    <label style={labelStyle}>Contact (phone or address)</label>
                    <input style={input} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="(555) 555-5555 • 123 Main St" />
                  </div>
                </div>

                {/* Initial Medications */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ marginBottom: 8, fontWeight: 600, color: "#0f172a" }}>Initial Medications (optional)</div>
                  {meds.map((m, i) => (
                    <div key={i} style={{ ...row3, alignItems: "center", marginBottom: 8 }}>
                      <input style={input} placeholder="Name (e.g., Lisinopril)" value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} />
                      <input style={input} placeholder="Dosage (e.g., 10 mg)" value={m.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)} />
                      <input style={input} placeholder="Frequency (e.g., daily)" value={m.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} />
                      <input style={input} placeholder="Route (e.g., PO)" value={m.route} onChange={(e) => updateMed(i, "route", e.target.value)} />
                      <select style={input} value={m.kind} onChange={(e) => updateMed(i, "kind", e.target.value)}>
                        <option value="rx">Prescription</option>
                        <option value="otc">OTC</option>
                      </select>
                      <input style={input} placeholder="Notes" value={m.notes} onChange={(e) => updateMed(i, "notes", e.target.value)} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" style={btnGhost} onClick={() => removeMedRow(i)}>Remove</button>
                        {i === meds.length - 1 && (
                          <button type="button" style={btnGhost} onClick={addMedRow}>Add Another</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Schedule */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ marginBottom: 8, fontWeight: 600, color: "#0f172a" }}>Schedule (optional)</div>
                  <div style={row2}>
                    <div>
                      <label style={labelStyle}>Next Visit</label>
                      <input style={input} type="datetime-local" value={nextVisit} onChange={(e) => setNextVisit(e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Location</label>
                      <input style={input} value={visitLocation} onChange={(e) => setVisitLocation(e.target.value)} placeholder="Clinic A, Room 4" />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Reason</label>
                    <input style={input} value={visitReason} onChange={(e) => setVisitReason(e.target.value)} placeholder="Follow-up BP check" />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button type="button" style={btnGhost} onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" style={btnPrimary}>Create Patient</button>
                </div>
              </form>
            </div>
          )}

          {/* Patient Lookup (your original search—unchanged) */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={cardHeader}>
              <h2 style={h2}>Patient Lookup</h2>
            </div>

            <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search patients by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...input, width: 320 }}
              />
              <button type="submit" className="login-btn" style={btnGhost}>
                Search
              </button>
            </form>

            {results.length > 0 ? (
              <ul style={{ marginTop: 12, lineHeight: 1.9 }}>
                {results.map((p) => (
                  <li key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #f1f5f9" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>DOB: {p.dob || "—"}</div>
                    </div>
                    <button className="login-btn" style={btnGhost} onClick={() => setSelectedPatient(p)}>
                      View Profile
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ ...muted, marginTop: 12 }}>No results yet. Try “John” or “Jane”.</p>
            )}
          </div>

          {/* Selected Patient Profile */}
          {selectedPatient && (
            <div style={{ ...card, marginBottom: 24 }}>
              <div style={cardHeader}>
                <h2 style={h2}>Patient Profile</h2>
              </div>

              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                <div><strong style={{ color: "#0f172a" }}>Name:</strong> {selectedPatient.name}</div>
                <div><strong style={{ color: "#0f172a" }}>Email:</strong> {selectedPatient.email}</div>
                <div><strong style={{ color: "#0f172a" }}>Date of Birth:</strong> {selectedPatient.dob}</div>
                <div><strong style={{ color: "#0f172a" }}>Phone Number:</strong> {selectedPatient.phone}</div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <strong style={{ color: "#0f172a" }}>Address:</strong> {selectedPatient.addr}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="login-btn" style={btnPrimary} onClick={handleNewPrescription}>
                  New Prescription
                </button>
                <button className="login-btn" style={btnGhost} onClick={() => setSelectedPatient(null)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
