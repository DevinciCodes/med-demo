import { useMemo, useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import MedAutocomplete from "../components/MedAutoComplete";
import { MEDICATION_NAMES } from "../components/medNamesToBeReplacedWithFirebase";

// =========== Shared look & feel (mirrors ProviderDashboard) ===========
// Explicit color overrides so text doesn't turn white on light surfaces
const container   = { maxWidth: 960, margin: "0 auto" };
const pageWrap    = {
  marginLeft: "220px",
  padding: "2rem",
  flex: 1,
  background: "#f8fafc",
  minHeight: "100vh",
  color: "#0f172a",
};
const card        = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  color: "#0f172a",
};
const cardHeader  = { marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" };
const h1          = { fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: 0.2 };
const h2          = { fontSize: 18, fontWeight: 600, margin: 0 };
const muted       = { color: "#64748b" };
const input       = {
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  outline: "none",
  fontSize: 14,
  width: "100%",
  background: "#fff",
  color: "#0f172a",
};
const buttonBase  = { padding: "10px 14px", borderRadius: 10, border: "1px solid transparent", cursor: "pointer", fontWeight: 600 };
const btnPrimary  = { ...buttonBase, background: "#4176c6ff", color: "#fff" };
const btnGhost    = { ...buttonBase, background: "#f8fafc", color: "#0f172a", border: "1px solid #e5e7eb" };
const statCard    = { ...card, marginBottom: 0, padding: "12px 16px", minWidth: 180 };
const row2        = { display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" };

// =========== Demo interaction rules (unchanged) ===========
const INTERACTIONS = {
  warfarin: ["ibuprofen", "naproxen", "aspirin", "amiodarone", "fluconazole"],
  ibuprofen: ["warfarin"],
  simvastatin: ["clarithromycin", "erythromycin", "grapefruit"],
  sildenafil: ["nitroglycerin", "isosorbide mononitrate", "isosorbide dinitrate"],
  metformin: ["cimetidine"],
};

function findConflicts(meds) {
  const names = meds.map((m) => m.name.trim().toLowerCase());
  const conflicts = [];
  for (let i = 0; i < names.length; i++) {
    const a = names[i];
    const badWith = INTERACTIONS[a] || [];
    for (let j = i + 1; j < names.length; j++) {
      const b = names[j];
      if (badWith.includes(b) || (INTERACTIONS[b] || []).includes(a)) {
        conflicts.push({ a: meds[i].name, b: meds[j].name });
      }
    }
  }
  return conflicts;
}

// =========== 7-day schedule helpers (unchanged logic) ===========
const NOW = new Date();
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays    = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const formatDay  = (d) => d.toLocaleDateString(undefined, { weekday: "short" });
const formatMd   = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

function buildWeekPlan(meds, from = startOfDay(NOW)) {
  const days = [...Array(7)].map((_, i) => startOfDay(addDays(from, i)));
  const plan = days.map(() => []);
  meds.forEach((m) => {
    const freq = (m.freq || "QD").toUpperCase();
    const sd = m.started ? new Date(m.started) : null;
    const ed = m.ends ? new Date(m.ends) : null;

    days.forEach((day, idx) => {
      const inRange = (!sd || day >= startOfDay(sd)) && (!ed || day <= startOfDay(ed));
      if (!inRange) return;

      const entry = { name: m.name, dose: m.dose, freq, prn: freq === "PRN" };

      if (freq === "QOD" || freq === "QD" || freq === "AM" || freq === "PM" || freq === "HS") {
        if (freq === "QOD") {
          const anchor = startOfDay(sd || NOW);
          const diff = Math.round((day - anchor) / 86400000);
          if (diff % 2 === 0) plan[idx].push(entry);
        } else {
          plan[idx].push(entry);
        }
      } else if (freq === "BID") {
        plan[idx].push({ ...entry, note: "AM" });
        plan[idx].push({ ...entry, note: "PM" });
      } else if (freq === "TID") {
        plan[idx].push({ ...entry, note: "AM" });
        plan[idx].push({ ...entry, note: "Noon" });
        plan[idx].push({ ...entry, note: "PM" });
      } else if (freq === "PRN") {
        plan[idx].push(entry);
      } else {
        plan[idx].push(entry);
      }
    });
  });
  return { days, plan };
}

// =========== Small reusable pieces (styled like provider) ===========
function SectionCard({ title, right, children, maxWidth }) {
  return (
    <section style={{ ...card, ...(maxWidth ? { maxWidth } : {}) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        {title ? <h3 style={{ margin: 0 }}>{title}</h3> : <span />}
        {right}
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div style={statCard}>
      <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

// =========== Page ===========
export default function PatientDashboard() {
  const { user, userType, loading, signOut } = useAuth();

  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    async function loadPatientData() {
      if (!user) return;
      try {
        const ref = doc(db, "patients", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setPatientData(snap.data());
        } else {
          console.log("no patient record found");
        }
      } catch (err) {
        console.error("error loading patient data:", err);
      }
    }
    loadPatientData();
  }, [user]);

  // 🔁 Use ?tab=... from the URL (sidebar controls this)
  const [params, setParams] = useSearchParams();
  const readTab = () => (params.get("tab") || "overview").toLowerCase();
  const [tab, setTab] = useState(readTab());
  useEffect(() => { setTab(readTab()); }, [params]);

  if (loading) return null;
  if (!user) return <Navigate to="/home" replace />;
  if (userType && userType !== "patient") return <Navigate to="/provider" replace />;

  // Demo meds (unchanged)
  const [meds, setMeds] = useState([
    { id: "m1", name: "Warfarin",   dose: "5 mg",   freq: "QD", eng: "Once a day", started: "2025-10-01" },
    { id: "m2", name: "Ibuprofen",  dose: "200 mg", freq: "PRN", eng: "As needed", started: "2025-10-18" },
    { id: "m3", name: "Metformin",  dose: "850 mg", freq: "BID", eng: "Twice a day", started: "2025-06-11" },
  ]);

  const conflicts = useMemo(() => findConflicts(meds), [meds]);
  const stats = useMemo(() => ({ active: meds.length, risky: conflicts.length }), [meds.length, conflicts.length]);

  // ---- Embedded subcomponents (styled like provider) ----
  const WeekCalendar = () => {
    const { days, plan } = useMemo(() => buildWeekPlan(meds), [meds]);
    const todayIdx = 0;

    return (
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(7, minmax(120px, 1fr))", overflowX: "auto" }}>
        {days.map((d, i) => {
          const items = plan[i];
          const nonPrnCount = items.filter((x) => !x.prn).length;
          const isToday = i === todayIdx;
          return (
            <div
              key={i}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                background: isToday ? "#f1f5f9" : "#fff",
                padding: 10,
                minHeight: 120,
                color: "#0f172a",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>{formatDay(d)}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{formatMd(d)}</div>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                {nonPrnCount} scheduled {nonPrnCount === 1 ? "dose" : "doses"}
              </div>
              <ul style={{ margin: "6px 0 0", paddingLeft: 16, maxHeight: 160, overflow: "auto" }}>
                {items.map((it, k) => (
                  <li key={k} style={{ fontSize: 13 }}>
                    <strong>{it.name}</strong> {it.dose} {it.note ? `· ${it.note}` : ""}
                    {it.prn && <span style={{ marginLeft: 6, fontSize: 11, color: "#64748b" }}>(PRN)</span>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

  const AlertsSection = () => (
    <SectionCard title="Interaction Alerts">
      {conflicts.length === 0 ? (
        <div style={{ color: "#64748b" }}>No known interactions in this list.</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {conflicts.map((p, i) => (
            <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <strong>{p.a}</strong> may interact with <strong>{p.b}</strong>.
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  (Demo rules) Advise patient to consult provider/pharmacist.
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );

  const MedsSection = () => {
    const [filter, setFilter] = useState("");
    const [draft, setDraft] = useState({ name: "", dose: "", freq: "QD", eng: "Once a day" });
    const filtered = meds.filter((m) => m.name.toLowerCase().includes(filter.toLowerCase()));

    return (
      <>
        {/* Add Medication */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={cardHeader}><h2 style={h2}>Add Medication</h2></div>
          <div style={{ display: "grid", gap: 8, maxWidth: 560 }}>
            <MedAutocomplete
              options={MEDICATION_NAMES}
              inputStyle={input}
              placeholder="Medication name"
              value={draft.name}
              onChange={(val) =>
                setDraft((d) => ({ ...d, name: val }))
              }
            />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ ...input, flex: 1 }}
                placeholder="Dose (e.g., 10 mg, 1 tablet, 1 injection)"
                value={draft.dose}
                onChange={(e) => setDraft((d) => ({ ...d, dose: e.target.value }))}
              />
              <select
                style={{ ...input, flex: 1, height: 42 }}
                value={draft.eng}
                onChange={(e) => setDraft((d) => ({ ...d, eng: e.target.value }))}
              >
                {["Once a day", "Twice a day", "Three times a day", "Four times a day", "Every other day"
                , "Once a week", "Twice a week", "Every 2 Hours", "Every 4 Hours", "Every 6 Hours"
                , "Every 8 Hours", "Every 12 Hours", "Every 2-4 Hours", "Every 4-6 Hours", "Before meals"
                , "Morning", "Nighttime", "At Bedtime", "As Needed"].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="login-btn"
                style={btnPrimary}
                onClick={() => {
                  if (!draft.name.trim()) return;
                  setMeds((xs) => [
                    ...xs,
                    {
                      id: crypto.randomUUID(),
                      name: draft.name.trim(),
                      dose: draft.dose.trim(),
                      eng: draft.eng,
                      started: new Date().toISOString().slice(0, 10),
                    },
                  ]);
                  setDraft({ name: "", dose: "", eng: "Once a day" });
                }}
              >
                Add
              </button>
              <button className="login-btn" style={btnGhost} onClick={() => setDraft({ name: "", dose: "", freq: "QD", eng: "Once a day" })}>
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Medications List */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={cardHeader}>
            <h2 style={h2}>Medications</h2>
            <input
              placeholder="Filter by name…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ ...input, width: 240 }}
            />
          </div>

          {filtered.length ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  {["Name", "Dose", "Frequency", "Started"].map((h) => (
                    <th key={h} style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 4px", fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 4px" }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id}>
                    <td style={{ padding: "8px 4px", borderBottom: "1px solid #f1f5f9" }}>{m.name}</td>
                    <td style={{ padding: "8px 4px", borderBottom: "1px solid #f1f5f9" }}>{m.dose}</td>
                    <td style={{ padding: "8px 4px", borderBottom: "1px solid #f1f5f9" }}>{m.eng}</td>
                    <td style={{ padding: "8px 4px", borderBottom: "1px solid #f1f5f9" }}>{m.started || "-"}</td>
                    <td style={{ padding: "8px 4px", borderBottom: "1px solid #f1f5f9", textAlign: "right" }}>
                      <button
                        className="login-btn"
                        style={btnGhost}
                        onClick={() => setMeds((xs) => xs.filter((x) => x.id !== m.id))}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: "#64748b" }}>No medications.</div>
          )}
        </div>
      </>
    );
  };

  const Overview = () => (
    <>
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={cardHeader}>
          <div>
            <h1 style={h1}>Patient Dashboard</h1>
            <div style={{ ...muted, fontSize: 14 }}>Your weekly plan, meds, and safety alerts.</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Stat label="Active Meds" value={stats.active} />
          <Stat label="Interaction Alerts" value={stats.risky} />
        </div>
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={cardHeader}><h2 style={h2}>This Week</h2></div>
        <WeekCalendar />
      </div>

      <AlertsSection />
    </>
  );

  const Settings = () => (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={cardHeader}><h2 style={h2}>Settings</h2></div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="login-btn" style={btnGhost}>Change Password</button>
        <button className="login-btn" style={btnPrimary} onClick={signOut}>Logout</button>
      </div>
    </div>
  );

  // =========== Layout ===========
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={pageWrap}>
        <div style={container}>
          {/* Tabs are driven by ?tab=... from Sidebar; header inside each section */}
          {tab === "overview" && <Overview />}
          {tab === "meds" && <MedsSection />}
          {tab === "alerts" && <AlertsSection />}
          {tab === "settings" && <Settings />}
        </div>
      </div>
    </div>
  );
}