import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase";

export default function RequirePatient({ children }) {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);
  const [needsReset, setNeedsReset] = useState(false);

  useEffect(() => {
    const unsub = auth.onIdTokenChanged(async (u) => {
      if (!u) { setOk(false); setReady(true); return; }
      const tr = await u.getIdTokenResult(true);
      const { role, mustReset } = tr.claims || {};
      setNeedsReset(!!mustReset);
      setOk(role === "patient");
      setReady(true);
    });
    return () => unsub();
  }, []);

  if (!ready) return null;
  if (!auth.currentUser) return <Navigate to="/home" replace />;
  if (needsReset) return <Navigate to="/force-password-reset" replace />;
  if (!ok) return <Navigate to="/home" replace />;
  return children;
}
