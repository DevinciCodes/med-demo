// src/pages/ProviderDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  limit,
} from "firebase/firestore";

// ===== Your original mock data (kept for fallback/testing) =====
const mockPatients = [
  { id: "p1", name: "John Doe", email: "john.doe@example.com", dob: "1990-01-15", phone: "111-111-1111", addr:"3920 Lakeview Drive, Austin, TX 78745" },
  { id: "p2", name: "Jane Smith", email: "jane.smith@example.com", dob: "1985-07-22", phone: "098-765-4321", addr:"5871 Maplewood Avenue, Columbus, OH 43214" },
  { id: "p3", name: "Alice Johnson", email: "alice.johnson@example.com", dob: "2000-03-10", phone: "123-456-7890", addr:"1248 Evergreen Terrace, Springfield, IL 62704" },
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
const btnPrimary  = { ...buttonBase, background: "#4176c6", color: "#fff" };
const btnGhost    = { ...buttonBase, background: "#f8fafc", color: "#0f172a", border: "1px solid #e5e7eb" };
const bannerOk    = { margin: "12px 0", padding: 12, borderRadius: 10, border: "1px solid #a7f3d0", background: "#ecfdf5", color: "#065f46" };
const bannerErr   = { margin: "12px 0", padding: 12, borderRadius: 10, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b" };

function genTempPassword() {
  const base = Math.random().toString(36).slice(-6);
  return "Temp!" + base;
}

export default function ProviderDashboard() {
  const navigate = useNavigate();

  // ===== global banners =====
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [tempCreds, setTempCreds] = useState(null);

  // ===== search state =====
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]); // unified results (Firestore first, mock if empty)

  // ===== selected patient and live data =====
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatientDoc, setSelectedPatientDoc] = useState(null); // raw Firestore doc data
  const [medications, setMedications] = useState([]); // live from subcollection

  // ===== create patient collapsible =====
  const [showCreate, setShowCreate] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [dob, setDob]             = useState("");
  const [allergies, setAllergies] = useState("");
  const [contact, setContact]     = useState("");
  const [medsDraft, setMedsDraft] = useState([
    { name: "", dosage: "", frequency: "", route: "", kind: "rx", notes: "" },
  ]);
  const [nextVisit, setNextVisit] = useState("");
  const [visitReason, setVisitReason] = useState("");
  const [visitLocation, setVisitLocation] = useState("");

  // ===== add medication form (for selected patient) =====
  const [newMed, setNewMed] = useState({ name: "", dosage: "", frequency: "", route: "", kind: "rx", notes: "" });

  // ===== editing profile (selected patient) =====
  const [edit, setEdit] = useState(null);
  const isEditing = useMemo(() => Boolean(edit), [edit]);

  // --- helpers for meds rows in the create form
  const addMedRow = () => setMedsDraft((rows) => [...rows, { name: "", dosage: "", frequency: "", route: "", kind: "rx", notes: "" }]);
  const removeMedRow = (i) => setMedsDraft((rows) => rows.length === 1 ? rows : rows.filter((_, idx) => idx !== i));
  const updateMed = (i, field, value) => setMedsDraft((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const copyCreds = async () => {
    if (!tempCreds) return;
    const txt = `Patient Portal\nEmail: ${tempCreds.email}\nTemp Password: ${tempCreds.tempPassword}`;
    try { await navigator.clipboard.writeText(txt); setMsg("Credentials copied to clipboard."); }
    catch { setErr("Could not copy to clipboard."); }
  };

  // ====== CREATE PATIENT via backend (kept as you had it) ======
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setMsg(""); setErr(""); setTempCreds(null);

    if (!firstName || !lastName || !email) {
      setErr("First name, last name, and email are required.");
      return;
    }

    const tempPassword = genTempPassword();

    try {
      const provider = auth.currentUser;
      const providerId = provider?.uid || null;
      const providerEmail = provider?.email || null;

      const allergyArr = (allergies || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        email,
        firstName,
        lastName,
        dob: dob || "",
        phone: contact || "",
        allergies: allergyArr,
        tempPassword,
        providerId,
        providerEmail,
        // TIP: if your backend writes to Firestore, also save nameLower there:
        // nameLower: `${firstName} ${lastName}`.toLowerCase()
      };

      const res = await fetch("/api/provider/create_patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Failed to create patient");
      }

      const { uid } = await res.json();

      setMsg("Patient account created.");
      setTempCreds({ email, tempPassword });

      // optional: optimistic insert to mock for quick UX
      mockPatients.unshift({
        id: uid,
        name: `${firstName} ${lastName}`,
        email,
        dob,
        phone: contact,
        addr: contact,
      });

      // reset fields and close
      setFirstName(""); setLastName(""); setEmail(""); setDob("");
      setAllergies(""); setContact("");
      setMedsDraft([{ name: "", dosage: "", frequency: "", route: "", kind: "rx", notes: "" }]);
      setNextVisit(""); setVisitReason(""); setVisitLocation("");
      setShowCreate(false);
    } catch (e) {
      setErr(e.message);
    }
  };

  // ====== SEARCH: Firestore-first, fallback to mock ======
  const handleSearch = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");

    const term = (search || "").trim();
    const patientsCol = collection(db, "Patients");

    try {
      let found = [];

      if (term) {
        // Preferred: prefix search on nameLower (if your docs have it)
        try {
          const lower = term.toLowerCase();
          const q1 = query(
            patientsCol,
            orderBy("nameLower"),
            startAt(lower),
            endAt(lower + "\uf8ff"),
            limit(25)
          );
          const snap = await getDocs(q1);
          snap.forEach((d) => {
            const data = d.data() || {};
            const name = data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim();
            found.push({
              id: d.id,
              name,
              email: data.email || "",
              dob: data.dob || "",
              phone: data.phone || "",
              addr: data.address || data.addr || "",
            });
          });
        } catch {
          // ignore and fall through to fallback
        }

        // Fallback: light client filter over recent (if nameLower missing)
        if (found.length === 0) {
          const q2 = query(patientsCol, orderBy("createdAt", "desc"), limit(200));
          const snap = await getDocs(q2);
          const termLower = term.toLowerCase();
          snap.forEach((d) => {
            const data = d.data() || {};
            const name = data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim();
            if (name.toLowerCase().includes(termLower)) {
              found.push({
                id: d.id,
                name,
                email: data.email || "",
                dob: data.dob || "",
                phone: data.phone || "",
                addr: data.address || data.addr || "",
              });
            }
          });
        }
      } else {
        // No term: show recent
        const q3 = query(patientsCol, orderBy("createdAt", "desc"), limit(25));
        const snap = await getDocs(q3);
        snap.forEach((d) => {
          const data = d.data() || {};
          const name = data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim();
          found.push({
            id: d.id,
            name,
            email: data.email || "",
            dob: data.dob || "",
            phone: data.phone || "",
            addr: data.address || data.addr || "",
          });
        });
      }

      // If Firestore empty, fall back to mock
      if (found.length === 0 && term) {
        const filtered = mockPatients.filter((p) =>
          p.name.toLowerCase().includes(term.toLowerCase())
        );
        setResults(filtered);
      } else {
        setResults(found);
      }
    } catch (e) {
      setErr(`Search failed: ${e.message}`);
    }
  };

  // ====== Select a patient: load doc and live Medications ======
  const openPatient = async (p) => {
    setSelectedPatient(p);
    setSelectedPatientDoc(null);
    setMedications([]);

    try {
      const ref = doc(db, "Patients", p.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSelectedPatientDoc({ id: snap.id, ...snap.data() });
      }

      // live medications
      const medsCol = collection(db, "Patients", p.id, "Medications");
      const medsQ = query(medsCol, orderBy("createdAt", "desc"), limit(100));
      const unsub = onSnapshot(medsQ, (qs) => {
        const arr = [];
        qs.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setMedications(arr);
      });

      // cleanup on close/change
      return () => unsub && unsub();
    } catch (e) {
      setErr(`Load patient failed: ${e.message}`);
    }
  };

  // ====== Add medication to selected patient ======
  const addMedication = async () => {
    setMsg(""); setErr("");
    if (!selectedPatient) return;
    const { name, dosage, frequency, route, kind, notes } = newMed;
    if (!name) { setErr("Medication name is required."); return; }

    try {
      const medsCol = collection(db, "Patients", selectedPatient.id, "Medications");
      await addDoc(medsCol, {
        name, dosage, frequency, route, kind, notes,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || null,
      });
      setNewMed({ name: "", dosage: "", frequency: "", route: "", kind: "rx", notes: "" });
      setMsg("Medication added.");
    } catch (e) {
      setErr(`Add medication failed: ${e.message}`);
    }
  };

  // ====== Begin editing selected patient's profile ======
  const startEdit = () => {
    if (!selectedPatient) return;
    const base = selectedPatientDoc || {};
    const first = base.firstName ?? (selectedPatient.name?.split(" ")[0] || "");
    const last  = base.lastName  ?? (selectedPatient.name?.split(" ").slice(1).join(" ") || "");
    setEdit({
      firstName: first,
      lastName: last,
      dob: base.dob || selectedPatient.dob || "",
      phone: base.phone || selectedPatient.phone || "",
      address: base.address || selectedPatient.addr || "",
      allergies: Array.isArray(base.allergies) ? base.allergies.join(", ") : (base.allergies || ""),
    });
  };

  const saveEdit = async () => {
    setMsg(""); setErr("");
    if (!selectedPatient || !edit) return;

    try {
      const ref = doc(db, "Patients", selectedPatient.id);
      const firstName = (edit.firstName || "").trim();
      const lastName  = (edit.lastName  || "").trim();
      const fullName  = `${firstName} ${lastName}`.trim();
      const allergyArr = (edit.allergies || "")
        .split(",").map(s => s.trim()).filter(Boolean);

      await updateDoc(ref, {
        firstName,
        lastName,
        name: fullName,
        nameLower: fullName.toLowerCase(),
        dob: edit.dob || "",
        phone: edit.phone || "",
        address: edit.address || "",
        allergies: allergyArr,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || null,
      });

      // update UI selections
      const refreshed = await getDoc(ref);
      if (refreshed.exists()) {
        const data = refreshed.data();
        setSelectedPatientDoc({ id: refreshed.id, ...data });
        setSelectedPatient((prev) => prev
          ? { ...prev,
              name: data.name || prev.name,
              dob: data.dob || prev.dob,
              phone: data.phone || prev.phone,
              addr: data.address || prev.addr
            }
          : prev
        );
      }
      setEdit(null);
      setMsg("Patient profile updated.");
    } catch (e) {
      setErr(`Update failed: ${e.message}`);
    }
  };

  const cancelEdit = () => setEdit(null);

  const handleNewPrescription = () => {
    if (!selectedPatient) return;
    navigate("/provider/prescription", { state: { patient: selectedPatient } });
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
              <div style={{ ...muted, fontSize: 14 }}>Create patient, search Firestore, edit profile, and manage meds.</div>
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
                <h2 style={h2}>Temporary Patient Portal Credentials</h2>
              </div>
              <div style={{ lineHeight: 1.9 }}>
                <div>Email: <code style={{ color: "#0f172a" }}>{tempCreds.email}</code></div>
                <div>Temp Password: <code style={{ color: "#0f172a" }}>{tempCreds.tempPassword}</code></div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  User must reset their password on first login.
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
                    <label style={labelStyle}>DOB</label>
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

                {/* Initial Medications (optional) */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ marginBottom: 8, fontWeight: 600, color: "#0f172a" }}>Initial Medications (optional)</div>
                  {medsDraft.map((m, i) => (
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
                        {i === medsDraft.length - 1 && (
                          <button type="button" style={btnGhost} onClick={addMedRow}>Add Another</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Schedule (optional UI only for now) */}
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

          {/* Patient Lookup */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={cardHeader}>
              <h2 style={h2}>Patient Lookup</h2>
            </div>

            <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search Firestore patients by name…"
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
                    <button className="login-btn" style={btnGhost} onClick={() => openPatient(p)}>
                      View Profile
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ ...muted, marginTop: 12 }}>No results yet. Try typing a name, or leave blank and press Search to see recent.</p>
            )}
          </div>

          {/* Selected Patient Profile */}
          {selectedPatient && (
            <div style={{ ...card, marginBottom: 24 }}>
              <div style={cardHeader}>
                <h2 style={h2}>Patient Profile</h2>
                {!isEditing ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="login-btn" style={btnGhost} onClick={startEdit}>Edit Profile</button>
                    <button className="login-btn" style={btnPrimary} onClick={handleNewPrescription}>
                      New Prescription
                    </button>
                    <button className="login-btn" style={btnGhost} onClick={() => setSelectedPatient(null)}>
                      Close
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="login-btn" style={btnGhost} onClick={cancelEdit}>Cancel</button>
                    <button className="login-btn" style={btnPrimary} onClick={saveEdit}>Save</button>
                  </div>
                )}
              </div>

              {/* view mode */}
              {!isEditing && (
                <>
                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                    <div><strong style={{ color: "#0f172a" }}>Name:</strong> {selectedPatient.name}</div>
                    <div><strong style={{ color: "#0f172a" }}>Email:</strong> {selectedPatient.email}</div>
                    <div><strong style={{ color: "#0f172a" }}>Date of Birth:</strong> {selectedPatient.dob || "—"}</div>
                    <div><strong style={{ color: "#0f172a" }}>Phone Number:</strong> {selectedPatient.phone || "—"}</div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <strong style={{ color: "#0f172a" }}>Address:</strong> {selectedPatient.addr || "—"}
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <strong style={{ color: "#0f172a" }}>Allergies:</strong>{" "}
                      {Array.isArray(selectedPatientDoc?.allergies) && selectedPatientDoc.allergies.length
                        ? selectedPatientDoc.allergies.join(", ")
                        : (selectedPatientDoc?.allergies || "—")}
                    </div>
                  </div>

                  {/* Medications live list + add form */}
                  <div style={{ marginTop: 20 }}>
                    <h3 style={{ ...h2, fontSize: 16 }}>Medications</h3>
                    {medications.length ? (
                      <ul style={{ marginTop: 8 }}>
                        {medications.map((m) => (
                          <li key={m.id} style={{ padding: "8px 0", borderTop: "1px solid #f1f5f9" }}>
                            <div style={{ fontWeight: 600 }}>{m.name}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              {m.dosage || "—"} · {m.frequency || "—"} · {m.route || "—"} · {m.kind?.toUpperCase() || "—"}
                              {m.notes ? ` — ${m.notes}` : ""}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ ...muted, marginTop: 8 }}>No medications yet.</p>
                    )}

                    <div style={{ marginTop: 12, ...row3 }}>
                      <input style={input} placeholder="Name" value={newMed.name} onChange={(e) => setNewMed((s)=>({ ...s, name: e.target.value }))} />
                      <input style={input} placeholder="Dosage" value={newMed.dosage} onChange={(e) => setNewMed((s)=>({ ...s, dosage: e.target.value }))} />
                      <input style={input} placeholder="Frequency" value={newMed.frequency} onChange={(e) => setNewMed((s)=>({ ...s, frequency: e.target.value }))} />
                      <input style={input} placeholder="Route" value={newMed.route} onChange={(e) => setNewMed((s)=>({ ...s, route: e.target.value }))} />
                      <select style={input} value={newMed.kind} onChange={(e) => setNewMed((s)=>({ ...s, kind: e.target.value }))}>
                        <option value="rx">Prescription</option>
                        <option value="otc">OTC</option>
                      </select>
                      <input style={input} placeholder="Notes" value={newMed.notes} onChange={(e) => setNewMed((s)=>({ ...s, notes: e.target.value }))} />
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <button className="login-btn" style={btnGhost} onClick={addMedication}>Add Medication</button>
                    </div>
                  </div>
                </>
              )}

              {/* edit mode */}
              {isEditing && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={row2}>
                    <div>
                      <label style={labelStyle}>First Name</label>
                      <input style={input} value={edit.firstName} onChange={(e)=>setEdit((s)=>({ ...s, firstName: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Last Name</label>
                      <input style={input} value={edit.lastName} onChange={(e)=>setEdit((s)=>({ ...s, lastName: e.target.value }))} />
                    </div>
                  </div>
                  <div style={row2}>
                    <div>
                      <label style={labelStyle}>DOB</label>
                      <input style={input} value={edit.dob} onChange={(e)=>setEdit((s)=>({ ...s, dob: e.target.value }))} placeholder="YYYY-MM-DD" />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input style={input} value={edit.phone} onChange={(e)=>setEdit((s)=>({ ...s, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Address</label>
                    <input style={input} value={edit.address} onChange={(e)=>setEdit((s)=>({ ...s, address: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Allergies (comma-separated)</label>
                    <input style={input} value={edit.allergies} onChange={(e)=>setEdit((s)=>({ ...s, allergies: e.target.value }))} placeholder="penicillin, peanuts" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
