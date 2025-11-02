// src/hooks/useIsAdmin.js
import { useEffect, useState } from "react";
import { auth } from "../firebase";

export function useIsAdmin() {
  const [state, setState] = useState({ loading: true, isAdmin: false, user: null });

  useEffect(() => {
    const off = auth.onIdTokenChanged(async (user) => {
      if (!user) {
        setState({ loading: false, isAdmin: false, user: null });
        return;
      }
      try {
        const res = await user.getIdTokenResult();
        setState({ loading: false, isAdmin: res.claims?.role === "admin", user });
      } catch {
        setState({ loading: false, isAdmin: false, user });
      }
    });
    return () => off && off();
  }, []);

  return state; // { loading, isAdmin, user }
}
