import { createContext, useContext, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [userType, setUserType] = useState(null);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       setUser(currentUser);
//       if (currentUser) {
//         const docSnap = await getDoc(doc(db, "users", currentUser.uid));
//         setUserType(docSnap.exists() ? docSnap.data().userType : null);
//       } else {
//         setUserType(null);
//       }
//     });
//     return unsubscribe;
//   }, []);

//   return <AuthContext.Provider value={{ user, userType }}>{children}</AuthContext.Provider>;
// }

// bypasses Firebase
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser, userType, setUserType }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
