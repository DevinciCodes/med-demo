import { db } from "../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export async function addProvider(provider) {
  const col = collection(db, "providers");
  const docRef = await addDoc(col, provider);
  return docRef.id;
}

export async function getProviders() {
  const snapshot = await getDocs(collection(db, "providers"));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}
