// src/utils/aiDrugInteractionService.js

// Base URL of your backend AI server
// In dev: http://localhost:4000
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

// Helper to normalize drug names
function normalizeNames(drugNames) {
  return Array.from(
    new Set(
      (drugNames || [])
        .map((n) => (n || "").trim())
        .filter((n) => n.length > 0)
    )
  );
}

/**
 * Call your backend to check drug–drug interactions.
 *
 * Returns:
 * { summary: string, interactions: [ { drugs: [..], severity, description, action } ] }
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
    body: JSON.stringify({ drugs: meds }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Backend AI error:", res.status, text);
    throw new Error("Backend AI error");
  }

  const data = await res.json();
  return {
    summary: data.summary || "",
    interactions: data.interactions || [],
  };
}
