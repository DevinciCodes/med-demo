// src/pages/Patient_Dashboard.jsx
import { useMemo, useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

import "../assets/styles/dashboard.css";

/* ---------- tiny UI helpers (keep your current look) ---------- */
const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "#fff",
  padding: "1rem",
  marginBottom: "1rem",
};

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
    <div style={{ ...card, marginBottom: 0, padding: "0.75rem 1rem", minWidth: 180 }}>
      <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

/* ---------- simple interaction rules (extensible) ---------- */
const INTERACTIONS = {
  warfarin: ["ibuprofen", "naproxen", "aspirin", "amiodarone", "fluconazole"],
  ibuprofen: ["warfarin"],
  simvastatin: ["clarithromycin", "erythromycin", "grapefruit"],
  sildenafil: ["nitroglycerin", "isosorbide mononitrate", "isosorbide dinitrate"],
  metformin: ["cimetidine"],
};
/* Returns array of pairs that conflict: [{a,b}] */
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

/* ---------- 7-day schedule utility ---------- */
const NOW = new Date();
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function formatDay(d) { return d.toLocaleDateString(undefined, { weekday: "short" }); }
function formatMd(d) { return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }

/* Given meds with freq + optional startDate/endDate, build plan for 7 days */
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
        plan[idx].push(entry); // shown but not counted
      } else {
        plan[idx].push(entry); // default
      }
    });
  });
  return { days, plan };
}

/* ---------- Page ---------- */
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

  // Keep local state in sync if user clicks sidebar links
  useEffect(() => { setTab(readTab()); }, [params]);

  if (loading) return null;
  if (!user) return <Navigate to="/home" replace />;
  if (userType && userType !== "patient") return <Navigate to="/provider" replace />;

  /* In-memory demo data; wire to your DB when ready */
  const [meds, setMeds] = useState([
    { id: "m1", name: "Warfarin", dose: "5 mg", freq: "QD", started: "2025-10-01" },
    { id: "m2", name: "Ibuprofen", dose: "200 mg", freq: "PRN", started: "2025-10-18" },
    { id: "m3", name: "Metformin", dose: "850 mg", freq: "BID", started: "2025-06-11" },
  ]);

  const conflicts = useMemo(() => findConflicts(meds), [meds]);
  const stats = useMemo(() => {
    const active = meds.length;
    const risky = conflicts.length;
    return { active, risky };
  }, [meds.length, conflicts.length]);

  /* ----- Components ----- */
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
                padding: "10px",
                minHeight: 120,
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

  const MedsSection = () => {
    const [filter, setFilter] = useState("");
    const [draft, setDraft] = useState({ name: "", dose: "", freq: "QD" });
    const filtered = meds.filter((m) => m.name.toLowerCase().includes(filter.toLowerCase()));

    return (
      <>
        {/* ✨ Add medication FIRST */}
        <SectionCard title="Add medication" maxWidth={560}>
          <div style={{ display: "grid", gap: 8 }}>
            <input
              className="input"
              placeholder="Medication name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="Dose (e.g., 10 mg)"
                value={draft.dose}
                onChange={(e) => setDraft((d) => ({ ...d, dose: e.target.value }))}
              />
              <select
                className="input"
                style={{ flex: 1, height: 38 }}
                value={draft.freq}
                onChange={(e) => setDraft((d) => ({ ...d, freq: e.target.value }))}
              >
                {["QD", "BID", "TID", "QOD", "AM", "PM", "HS", "PRN"].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <button
              className="login-btn"
              onClick={() => {
                if (!draft.name.trim()) return;
                setMeds((xs) => [
                  ...xs,
                  {
                    id: crypto.randomUUID(),
                    name: draft.name.trim(),
                    dose: draft.dose,
                    freq: draft.freq,
                    started: new Date().toISOString().slice(0, 10),
                  },
                ]);
                setDraft({ name: "", dose: "", freq: "QD" });
              }}
            >
              Add
            </button>
          </div>
        </SectionCard>

        {/* Then the list */}
        <SectionCard
          title="Medications"
          right={
            <input
              placeholder="Filter by name…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input"
              style={{ width: 220, padding: "0.5rem", borderRadius: 10, border: "1px solid #cbd5e1" }}
            />
          }
        >
          {filtered.length ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  {["Name", "Dose", "Freq", "Started"].map((h) => (
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
                    <td style={{ padding: "8px 4px", borderBottom: "1px solid #f1f5f9" }}>{m.freq}</td>
                    <td style={{ padding: "8px 4px", borderBottom: "1px solid #f1f5f9" }}>{m.started || "-"}</td>
                    <td style={{ padding: "8px 4px", borderBottom: "1px solid #f1f5f9", textAlign: "right" }}>
                      <button
                        className="login-btn"
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
        </SectionCard>
      </>
    );
  };

  const AlertsSection = () => (
    <SectionCard title="Interaction alerts">
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

  const Overview = () => (
    <>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <Stat label="Active Meds" value={stats.active} />
        <Stat label="Interaction Alerts" value={stats.risky} />
      </div>

      <SectionCard title="This week">
        <WeekCalendar />
      </SectionCard>

      <AlertsSection />
    </>
  );

  const Settings = () => (
    <SectionCard title="Settings">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="login-btn">Change Password</button>
        <button className="login-btn" onClick={signOut}>Logout</button>
      </div>
    </SectionCard>
  );

  /* ---------- Layout ---------- */
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: 220, padding: "2rem", flex: 1 }}>
        <h1 style={{ marginTop: 0 }}>Patient Dashboard</h1>

        {/* Tabs removed — sidebar controls the tab via ?tab=... */}
        {tab === "overview" && <Overview />}
        {tab === "meds" && <MedsSection />}
        {tab === "alerts" && <AlertsSection />}
        {tab === "settings" && <Settings />}
      </div>
    </div>
  );
}
