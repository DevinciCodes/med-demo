import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const USE_MOCK = String(import.meta.env.VITE_USE_AUTH_MOCK).toLowerCase() === "true";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // {uid, email, displayName} or null
  const [userType, setUserType] = useState(null); // "patient" | "provider" | null
  const [loading, setLoading] = useState(true);

  // ---------- MOCK MODE ----------
  useEffect(() => {
    if (!USE_MOCK) return;
    // restore from localStorage so refresh doesn't log you out
    const saved = localStorage.getItem("mockUser");
    const savedType = localStorage.getItem("mockUserType");
    if (saved) setUser(JSON.parse(saved));
    if (savedType) setUserType(savedType);
    setLoading(false);
  }, []);

  // utilities only active in mock mode
  const loginMock = (email, role = "patient", displayName = null) => {
    if (!USE_MOCK) return;
    const uid = "mock-" + btoa(email).replace(/=+$/g, "").slice(0, 10);
    const u = { uid, email, displayName: displayName || email.split("@")[0] };
    setUser(u);
    setUserType(role);
    localStorage.setItem("mockUser", JSON.stringify(u));
    localStorage.setItem("mockUserType", role);
  };
  const logoutMock = () => {
    if (!USE_MOCK) return;
    setUser(null);
    setUserType(null);
    localStorage.removeItem("mockUser");
    localStorage.removeItem("mockUserType");
  };

  // ---------- REAL MODE ----------
  useEffect(() => {
    if (USE_MOCK) return;
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser || null);
        if (currentUser) {
          // OPTIONAL: read userType from Firestore users/{uid}.userType
          let type = null;
          try {
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            type = snap.exists() ? snap.data()?.userType ?? null : null;
          } catch {
            /* ignore */
          }
          setUserType(type ?? "patient"); // default while developing
        } else {
          setUserType(null);
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // signOut works in both modes
  const signOut = async () => {
    if (USE_MOCK) return logoutMock();
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  };

  const value = useMemo(
    () => ({
      user,
      userType,
      loading,
      // mock helpers (no-ops in real mode)
      mock: USE_MOCK,
      loginMock,
      logoutMock,
      setUserType, // handy if you want to flip roles in mock
      signOut,
    }),
    [user, userType, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
