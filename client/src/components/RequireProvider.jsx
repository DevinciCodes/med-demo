// src/components/RequireProvider.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function RequireProvider({ children }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setAllowed(false);
        setChecking(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "Providers", u.uid));
        setAllowed(snap.exists());
      } catch (e) {
        console.error("RequireProvider error:", e);
        setAllowed(false);
      } finally {
        setChecking(false);
      }
    });

    return () => unsub();
  }, []);

  if (checking) {
    // You can return a spinner/loader here if you want
    return null;
  }

  if (!allowed) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return children;
}
