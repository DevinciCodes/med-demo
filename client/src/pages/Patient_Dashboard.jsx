// src/pages/PatientDashboard.jsx
import { useMemo, useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import MedAutocomplete from "../components/MedAutoComplete";
import { MEDICATION_NAMES } from "../components/medNamesToBeReplacedWithFirebase";

// ===== Shared look & feel =====
const container   = { maxWidth: 960, margin: "0 auto" };
const pageWrap    = { marginLeft: "220px", padding: "2rem", flex: 1, background: "#f8fafc", minHeight: "100vh", color: "#0f172a" };
const card        = { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, color: "#0f172a" };
const cardHeader  = { marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" };
const h1          = { fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: 0.2 };
const h2          = { fontSize: 18, fontWeight: 600, margin: 0 };
const muted       = { color: "#64748b" };
const input       = { padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, outline: "none", fontSize: 14, width: "100%", background: "#fff", color: "#0f172a" };
const buttonBase  = { padding: "10px 14px", borderRadius: 10, border: "1px solid transparent", cursor: "pointer", fontWeight: 600 };
const btnPrimary  = { ...buttonBase, background: "#4176c6ff", color: "#fff" };
const btnGhost    = { ...buttonBase, background: "#f8fafc", color: "#0f172a", border: "1px solid #e5e7eb" };
const statCard    = { ...card, marginBottom: 0, padding: "12px 16px", minWidth: 180 };

// ===== Interaction rules =====
const INTERACTIONS = {
  warfarin: ["ibuprofen", "naproxen", "aspirin", "amiodarone", "fluconazole"],
  ibuprofen: ["warfarin"],
  simvastatin: ["clarithromycin", "erythromycin", "grapefruit"],
  sildenafil: ["nitroglycerin", "isosorbide mononitrate", "isosorbide dinitrate"],
  metformin: ["cimetidine"],
};
function findConflicts(meds) {
  const names = meds.map((m) => (m.name || "").trim().toLowerCase());
  const conflicts = [];
  for (let i = 0; i < names.length; i++) {
    const a = names[i];
    const badWith = INTERACTIONS[a] || [];
    for (let j = i + 1; j < names.length; j++) {
      const b = names[j];
      if (badWith.includes(b) || (INTERACTIONS[b] || []).includes(a)) {
        conflicts.push({ a: meds[i].name || "", b: meds[j].name || "" });
      }
    }
  }
  return conflicts;
}

// ===== Week plan helpers =====
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

      if (["QOD", "QD", "AM", "PM", "HS"].includes(freq)) {
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
      } else {
        // PRN & unknown → just show
        plan[idx].push(entry);
      }
    });
  });
  return { days, plan };
}

// ===== Small pieces =====
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

// ===== Page =====
export default function PatientDashboard() {
  const { user, userType, loading, signOut } = useAuth();

  // Tabs via ?tab=
  const [params] = useSearchParams();
  const readTab = () => (params.get("tab") || "overview").toLowerCase();
  const [tab, setTab] = useState(readTab());
  useEffect(() => { setTab(readTab()); }, [params]);

  if (loading) return null;
  if (!user) return <Navigate to="/home" replace />;
  if (userType && userType !== "patient") return <Navigate to="/provider" replace />;

  // ---- Find this user's Patient doc (by UID, then email)
  const [patientId, setPatientId] = useState(null);
  const [patientLoading, setPatientLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPatientLoading(true);
      try {
        if (user?.uid) {
          const byUid = await getDoc(doc(db, "Patients", user.uid));
          if (byUid.exists()) {
            if (!cancelled) setPatientId(user.uid);
            return;
          }
        }
        if (user?.email) {
          const qs = await getDocs(
            query(
              collection(db, "Patients"),
              where("email", "==", user.email),
              limit(1)
            )
          );
          if (!qs.empty) {
            if (!cancelled) setPatientId(qs.docs[0].id);
            return;
          }
        }
        if (!cancelled) setPatientId(null);
      } finally {
        if (!cancelled) setPatientLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.uid, user?.email]);

  // ---- Live meds from Firestore
  const [meds, setMeds] = useState([]);
  const [medsLoading, setMedsLoading] = useState(true);

  useEffect(() => {
    if (!patientId) {
      setMeds([]);
      setMedsLoading(false);
      return;
    }
    setMedsLoading(true);
    const medsCol = collection(db, "Patients", patientId, "Medications");
    const qMeds = query(medsCol, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      qMeds,
      (qs) => {
        const arr = [];
        qs.forEach((d) => {
          const data = d.data() || {};
          arr.push({
            id: d.id,
            name: data.name || "",
            dose: data.dosage || data.dose || "",
            freq: (data.frequency || data.freq || "QD").toUpperCase(),
            started:
              data.started ||
              (data.createdAt?.toDate?.()
                ? data.createdAt.toDate().toISOString().slice(0, 10)
                : ""),
            route: data.route || "",
            kind: (data.kind || "").toLowerCase(), // 'rx' or 'otc'
            createdBy: data.createdBy || null,
            notes: data.notes || "",
          });
        });
        setMeds(arr);
        setMedsLoading(false);
      },
      () => setMedsLoading(false)
    );
    return () => unsub();
  }, [patientId]);

  // ===== Medication options (same as provider dash: Firestore + fallback) =====
  const [medOptionsAll, setMedOptionsAll] = useState(
    (MEDICATION_NAMES || []).filter(
      (name) => typeof name === "string" && !name.includes("+")
    )
  );
  const [medOptionsOtc, setMedOptionsOtc] = useState([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // ---- medications_all (ALL meds) ----
        const allSnap = await getDocs(collection(db, "medications_all"));
        const allNames = [];
        allSnap.forEach((d) => {
          const data = d.data() || {};
          const raw =
            data.search_term || data.name || data.Name || data.drugName;
          const name = raw && String(raw).trim();
          if (!name) return;
          if (name.includes("+")) return; // skip combos
          allNames.push(name);
        });
        if (!cancelled && allNames.length) {
          allNames.sort((a, b) => a.localeCompare(b));
          setMedOptionsAll(allNames);
        }

        // ---- medications_otc (OTC meds) ----
        const otcSnap = await getDocs(collection(db, "medications_otc"));
        const otcNames = [];
        otcSnap.forEach((d) => {
          const data = d.data() || {};
          const raw =
            data.search_term || data.name || data.Name || data.drugName;
          const name = raw && String(raw).trim();
          if (!name) return;
          if (name.includes("+")) return;
          otcNames.push(name);
        });
        if (!cancelled && otcNames.length) {
          otcNames.sort((a, b) => a.localeCompare(b));
          setMedOptionsOtc(otcNames);
        }
      } catch (e) {
        console.error("Failed to load medication options:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Combined list exactly like provider dash `allMedsForAdd`
  const allMedsForAdd = useMemo(
    () => [...new Set([...medOptionsAll, ...medOptionsOtc])],
    [medOptionsAll, medOptionsOtc]
  );

  // ---- Derived
  const conflicts = useMemo(() => findConflicts(meds), [meds]);
  const stats = useMemo(
    () => ({ active: meds.length, risky: conflicts.length }),
    [meds.length, conflicts.length]
  );

  // ---- Add OTC (uses same med list as provider dash)
  const addOTC = async (draft) => {
    if (!patientId) return;
    const medsCol = collection(db, "Patients", patientId, "Medications");
    await addDoc(medsCol, {
      name: draft.name.trim(),
      dosage: draft.dose.trim(),
      frequency: draft.freq,
      route: draft.route || "",
      kind: "otc",
      notes: draft.notes || "",
      createdAt: serverTimestamp(),
      createdBy: user?.uid || null,
    });
  };

  // Patient can remove ANY medication row
  const removeMedication = async (med) => {
    if (!patientId || !med?.id) return;
    await deleteDoc(doc(db, "Patients", patientId, "Medications", med.id));
  };

  // ---- Sections ----
  const WeekCalendar = () => {
    const { days, plan } = useMemo(() => buildWeekPlan(meds), [meds]);
    const todayIdx = 0;
    return (
      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(7, minmax(120px, 1fr))",
          overflowX: "auto",
        }}
      >
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {formatDay(d)}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {formatMd(d)}
                </div>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                {nonPrnCount} scheduled {nonPrnCount === 1 ? "dose" : "doses"}
              </div>
              <ul
                style={{
                  margin: "6px 0 0",
                  paddingLeft: 16,
                  maxHeight: 160,
                  overflow: "auto",
                }}
              >
                {items.map((it, k) => (
                  <li key={k} style={{ fontSize: 13 }}>
                    <strong>{it.name}</strong> {it.dose}{" "}
                    {it.note ? `· ${it.note}` : ""}
                    {it.prn && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: "#64748b",
                        }}
                      >
                        (PRN)
                      </span>
                    )}
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
        <div style={{ color: "#64748b" }}>
          No known interactions in this list.
        </div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {conflicts.map((p, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <strong>{p.a}</strong> may interact with{" "}
                <strong>{p.b}</strong>.
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
    const [draft, setDraft] = useState({
      name: "",
      dose: "",
      freq: "QD",
      route: "",
      notes: "",
    });

    // 🔎 Search: prefix filter (like provider search UX – type "a" → only "a..." meds)
    const filtered = meds.filter((m) =>
      (m.name || "")
        .toLowerCase()
        .startsWith(filter.trim().toLowerCase())
    );

    return (
      <>
        {/* Add OTC Medication (autocomplete backed by same Firestore lists as provider dash) */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={cardHeader}>
            <h2 style={h2}>Add OTC Medication</h2>
          </div>
          <div style={{ display: "grid", gap: 8, maxWidth: 680 }}>
            <MedAutocomplete
              options={allMedsForAdd}
              inputStyle={input}
              placeholder="Medication name"
              value={draft.name}
              onChange={(val) =>
                setDraft((d) => ({
                  ...d,
                  name: val,
                }))
              }
            />
            <div
              style={{
                display: "grid",
                gap: 8,
                gridTemplateColumns: "1fr 1fr 1fr",
              }}
            >
              <input
                style={input}
                placeholder="Dose (e.g., 200 mg)"
                value={draft.dose}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, dose: e.target.value }))
                }
              />
              <select
                style={{ ...input, height: 42 }}
                value={draft.freq}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, freq: e.target.value }))
                }
              >
                {["QD", "BID", "TID", "QOD", "AM", "PM", "HS", "PRN"].map(
                  (f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  )
                )}
              </select>
              <input
                style={input}
                placeholder="Route (e.g., PO)"
                value={draft.route}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, route: e.target.value }))
                }
              />
            </div>
            <input
              style={input}
              placeholder="Notes"
              value={draft.notes}
              onChange={(e) =>
                setDraft((d) => ({ ...d, notes: e.target.value }))
              }
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="login-btn"
                style={btnPrimary}
                onClick={async () => {
                  if (!draft.name.trim()) return;
                  await addOTC(draft);
                  setDraft({
                    name: "",
                    dose: "",
                    freq: "QD",
                    route: "",
                    notes: "",
                  });
                }}
              >
                Add OTC
              </button>
              <button
                className="login-btn"
                style={btnGhost}
                onClick={() =>
                  setDraft({
                    name: "",
                    dose: "",
                    freq: "QD",
                    route: "",
                    notes: "",
                  })
                }
              >
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
              placeholder="Search by name… (prefix)"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ ...input, width: 240 }}
            />
          </div>

          {medsLoading ? (
            <div style={{ color: "#64748b" }}>Loading…</div>
          ) : filtered.length ? (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed", // even columns
              }}
            >
              <thead>
                <tr style={{ textAlign: "left" }}>
                  {["Name", "Dose", "Freq", "Started", "Type", "Source"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          padding: "8px 4px",
                          fontWeight: 600,
                          fontSize: 13,
                          width: "14%",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                  <th
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "8px 4px",
                      width: "16%",
                    }}
                  >
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const isProvider = m.kind === "rx";
                  const sourceLabel = isProvider
                    ? "Provider"
                    : m.createdBy === user?.uid
                    ? "You"
                    : "Other";

                  return (
                    <tr key={m.id}>
                      <td
                        style={{
                          padding: "8px 4px",
                          borderBottom: "1px solid #f1f5f9",
                          wordWrap: "break-word",
                        }}
                      >
                        {m.name}
                      </td>
                      <td
                        style={{
                          padding: "8px 4px",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {m.dose}
                      </td>
                      <td
                        style={{
                          padding: "8px 4px",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {m.freq}
                      </td>
                      <td
                        style={{
                          padding: "8px 4px",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {m.started || "-"}
                      </td>
                      <td
                        style={{
                          padding: "8px 4px",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {(m.kind || "").toUpperCase()}
                      </td>
                      <td
                        style={{
                          padding: "8px 4px",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {sourceLabel}
                      </td>
                      <td
                        style={{
                          padding: "8px 4px",
                          borderBottom: "1px solid #f1f5f9",
                          textAlign: "right",
                        }}
                      >
                        <button
                          className="login-btn"
                          style={{
                            ...btnGhost,
                            padding: "6px 10px",
                            fontSize: 12,
                          }}
                          onClick={() => removeMedication(m)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
            <div style={{ ...muted, fontSize: 14 }}>
              Your weekly plan, meds, and safety alerts.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Stat label="Active Meds" value={stats.active} />
          <Stat label="Interaction Alerts" value={stats.risky} />
        </div>
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={cardHeader}>
          <h2 style={h2}>This Week</h2>
        </div>
        <WeekCalendar />
      </div>

      <AlertsSection />
    </>
  );

  const Settings = () => (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={cardHeader}>
        <h2 style={h2}>Settings</h2>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="login-btn" style={btnGhost}>
          Change Password
        </button>
        <button className="login-btn" style={btnPrimary} onClick={signOut}>
          Logout
        </button>
      </div>
    </div>
  );

  // ---- Load states / layout ----
  if (patientLoading) {
    return (
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={pageWrap}>
          <div style={container}>
            <div style={{ ...card }}>Loading your profile…</div>
          </div>
        </div>
      </div>
    );
  }
  if (!patientId) {
    return (
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={pageWrap}>
          <div style={container}>
            <div style={{ ...card }}>
              <h2 style={h2}>We couldn’t find your patient record.</h2>
              <p style={muted}>
                Ask your provider to make sure your email/UID matches your
                Patient document in Firestore.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={pageWrap}>
        <div style={container}>
          {tab === "overview" && <Overview />}
          {tab === "meds" && <MedsSection />}
          {tab === "alerts" && <AlertsSection />}
          {tab === "settings" && <Settings />}
        </div>
      </div>
    </div>
  );
}
