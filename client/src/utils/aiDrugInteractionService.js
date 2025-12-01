// src/utils/aiDrugInteractionService.js

// ===== Backend base URL =====
// In dev: http://localhost:3001 (or whatever your server uses)
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

// ===== Helper to normalize drug names =====
function normalizeNames(drugNames) {
  return Array.from(
    new Set(
      (drugNames || [])
        .map((n) => (n || "").trim())
        .filter((n) => n.length > 0)
    )
  );
}

// ===== Severity helpers =====
const SEVERITY_ORDER = {
  none: 0,
  minor: 1,
  moderate: 2,
  major: 3,
};

function normalizeSeverityWord(raw) {
  if (!raw) return "none";
  const s = String(raw).trim().toLowerCase();

  // Map various wordings into our 4 buckets
  if (["high", "severe", "very severe", "critical"].includes(s)) return "major";
  if (["medium", "moderate"].includes(s)) return "moderate";
  if (["low", "mild", "minor"].includes(s)) return "minor";
  if (["none", "no", "no interaction"].includes(s)) return "none";

  // Fallbacks if the model uses other phrases
  if (s.includes("life-threatening") || s.includes("life threatening")) {
    return "major";
  }
  if (s.includes("significant")) {
    return "moderate";
  }

  return "none";
}

/**
 * Automatically upgrade severity based on how risky the description/action text sounds.
 * This does NOT hardcode specific drug pairs; it just looks for dangerous phrases.
 */
function autoAdjustSeverity(interactions = []) {
  return interactions.map((interaction) => {
    const original = normalizeSeverityWord(interaction.severity);
    let severity = original;

    const text = (
      (interaction.description || "") +
      " " +
      (interaction.action || "")
    ).toLowerCase();

    // 🚨 Clearly serious / emergency-type phrases → at least MAJOR
    const majorSignals = [
      "life-threatening",
      "life threatening",
      "respiratory depression",
      "respiratory arrest",
      "cardiac arrest",
      "ventricular fibrillation",
      "torsades",
      "torsades de pointes",
      "anaphylaxis",
      "overdose",
      "requires emergency treatment",
      "requires immediate medical attention",
      "severe hypotension",
      "severe bradycardia",
      "seizure",
      "status epilepticus",
    ];

    // ⚠️ Significant but not quite emergency-level → at least MODERATE
    const moderateSignals = [
      "withdrawal",
      "acute withdrawal",
      "precipitate withdrawal",
      "marked sedation",
      "profound sedation",
      "significant sedation",
      "clinically significant",
      "requires close monitoring",
      "requires dose adjustment",
      "dose adjustment may be required",
      "risk of toxicity",
      "increase in drug levels",
      "elevated serum levels",
      "qtc prolongation",
      "qt prolongation",
      "prolonged qt",
    ];

    const hasAny = (phrases) => phrases.some((p) => text.includes(p));

    if (hasAny(majorSignals)) {
      if (SEVERITY_ORDER[severity] < SEVERITY_ORDER["major"]) {
        severity = "major";
      }
    } else if (hasAny(moderateSignals)) {
      if (SEVERITY_ORDER[severity] < SEVERITY_ORDER["moderate"]) {
        severity = "moderate";
      }
    }

    return {
      ...interaction,
      severity,
    };
  });
}

/**
 * Call your backend to check drug–drug interactions.
 *
 * Returns:
 * {
 *   summary: string,
 *   interactions: [
 *     { drugs: [..], severity, description, action }
 *   ]
 * }
 */
export async function checkDrugInteractionsWithAI(drugNames) {
  const meds = normalizeNames(drugNames);

  if (meds.length < 2) {
    return {
      summary: "Need at least two medications to check interactions.",
      interactions: [],
    };
  }

  const res = await fetch(`${API_BASE}/api/drug-interactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // 👇 matches your existing backend contract
    body: JSON.stringify({ drugs: meds }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Backend AI error:", res.status, text);
    throw new Error("Backend AI error");
  }

  const data = await res.json().catch(() => ({}));

  const rawInteractions = Array.isArray(data.interactions)
    ? data.interactions
    : [];

  const normalizedInteractions = autoAdjustSeverity(rawInteractions);

  return {
    summary: data.summary || "",
    interactions: normalizedInteractions,
  };
}
