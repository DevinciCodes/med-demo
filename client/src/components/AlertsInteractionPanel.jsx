// src/components/AlertsInteractionPanel.jsx

import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,            // ✅ for AIInteractions doc
  setDoc,         // ✅ to save results
  serverTimestamp // ✅ timestamp for last update
} from "firebase/firestore";
import { checkDrugInteractionsWithAI } from "../utils/aiDrugInteractionService";

function AlertsInteractionPanel({ patientId }) {
  const [meds, setMeds] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(true);

  const [checking, setChecking] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiInteractions, setAiInteractions] = useState([]);
  const [error, setError] = useState(null);
  const [aiLastUpdated, setAiLastUpdated] = useState(null); // optional, for “last checked”

  // 1) Subscribe to this patient's Medications
  useEffect(() => {
    if (!patientId) {
      setMeds([]);
      setLoadingMeds(false);
      return;
    }

    const medsRef = collection(db, "Patients", patientId, "Medications");
    const q = query(medsRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMeds(list);
        setLoadingMeds(false);
      },
      (err) => {
        console.error("Error loading meds:", err);
        setLoadingMeds(false);
      }
    );

    return () => unsub();
  }, [patientId]);

  // 2) 🔁 Stay in sync with shared AI result:
  //    Patients/{patientId}/AIInteractions/latest
  useEffect(() => {
    if (!patientId) {
      setAiSummary("");
      setAiInteractions([]);
      setAiLastUpdated(null);
      return;
    }

    const ref = doc(db, "Patients", patientId, "AIInteractions", "latest");

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setAiSummary("");
          setAiInteractions([]);
          setAiLastUpdated(null);
          return;
        }
        const data = snap.data() || {};
        setAiSummary(data.summary || "");
        setAiInteractions(data.interactions || []);
        const ts = data.updatedAt?.toDate?.();
        setAiLastUpdated(ts || null);
      },
      (err) => {
        console.error("Error loading AI interactions:", err);
      }
    );

    return () => unsub();
  }, [patientId]);

  const handleCheckInteractions = async () => {
    try {
      setChecking(true);
      setError(null);

      // Clear local UI while checking – Firestore subscription will repopulate
      setAiSummary("");
      setAiInteractions([]);

      const medNames = meds.map((m) => m.name).filter(Boolean);

      const result = await checkDrugInteractionsWithAI(medNames);

      // Local UI update so provider sees the result immediately
      setAiSummary(result.summary);
      setAiInteractions(result.interactions || []);

      // ✅ Persist result in Firestore so it survives logout/refresh
      if (patientId) {
        const ref = doc(db, "Patients", patientId, "AIInteractions", "latest");
        await setDoc(
          ref,
          {
            summary: result.summary || "",
            interactions: result.interactions || [],
            updatedAt: serverTimestamp(),
            source: "provider", // so you can tell who last ran it
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.error(err);
      setError("Unable to check interactions right now.");
    } finally {
      setChecking(false);
    }
  };

  const medNames = meds.map((m) => m.name).filter(Boolean);

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="text-lg font-semibold mb-2">
        Drug Interactions (AI-assisted)
      </h3>

      {loadingMeds ? (
        <p className="text-sm text-gray-500">Loading medications…</p>
      ) : medNames.length === 0 ? (
        <p className="text-sm text-gray-500">
          No medications on file for this patient.
        </p>
      ) : (
        <div className="mb-3">
          <p className="text-sm text-gray-700">
            Current medications for this patient:
          </p>
          <ul className="mt-1 text-sm list-disc list-inside text-gray-800">
            {medNames.map((name, idx) => (
              <li key={idx}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleCheckInteractions}
        disabled={checking || medNames.length < 2}
        className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
      >
        {checking ? "Checking interactions…" : "Check interactions"}
      </button>

      {medNames.length < 2 && !loadingMeds && (
        <p className="mt-2 text-xs text-gray-500">
          Add at least two medications to check for interactions.
        </p>
      )}

      {aiLastUpdated && (
        <p className="mt-2 text-xs text-gray-500">
          Last checked: {aiLastUpdated.toLocaleString()}
        </p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {aiSummary && (
        <p className="mt-3 text-sm font-medium text-gray-800">
          Summary: {aiSummary}
        </p>
      )}

      {aiInteractions.length > 0 && (
        <div className="mt-3 space-y-3">
          {aiInteractions.map((i, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-3 bg-white shadow-sm text-sm"
            >
              <p className="font-semibold">
                {i.drugs?.join(" ↔ ") || "Interaction"}
              </p>
              {i.severity && (
                <p className="mt-1">
                  <span className="font-semibold">Severity:</span>{" "}
                  <span className="uppercase">{i.severity}</span>
                </p>
              )}
              {i.description && (
                <p className="mt-1">
                  <span className="font-semibold">Details:</span>{" "}
                  {i.description}
                </p>
              )}
              {i.action && (
                <p className="mt-1 text-gray-700">
                  <span className="font-semibold">Suggested action:</span>{" "}
                  {i.action}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!checking &&
        !error &&
        aiSummary === "" &&
        aiInteractions.length === 0 &&
        medNames.length >= 2 && (
          <p className="mt-2 text-xs text-gray-500">
            Click &ldquo;Check interactions&rdquo; to analyze these medications
            with OpenAI.
          </p>
        )}
    </div>
  );
}

export default AlertsInteractionPanel;
