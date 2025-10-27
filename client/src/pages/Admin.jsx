import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Admin(){
  const { user } = useAuth();
  const [rows,setRows] = useState([]);
  const [err,setErr] = useState("");

  const load = async ()=>{
    try{
      const r = await api("/api/admin/pending_providers");
      setRows(r);
    }catch(e){ setErr(e.message); }
  };
  useEffect(()=>{ load(); },[]);

  const take = async (id, approve=true)=>{
    await api("/api/admin/approve_provider",{ method:"POST", body: JSON.stringify({provider_id:id, approve})});
    await load();
  };

  return (
    <main style={{maxWidth:800, margin:"40px auto"}}>
      <h1>Admin Panel</h1>
      <p>Signed in as: {user?.email}</p>
      {err && <p style={{color:"crimson"}}>{err}</p>}
      <h2>Pending Providers</h2>
      {rows.length===0 && <p>None pending.</p>}
      {rows.map(r=>(
        <div key={r.id} style={{display:"flex", gap:8, alignItems:"center", border:"1px solid #ddd", padding:8, borderRadius:8, marginBottom:8}}>
          <div style={{flex:1}}>
            <strong>{r.name}</strong> — {r.email}
            <div style={{fontSize:12, color:"#666"}}>{new Date(r.created_at).toLocaleString()}</div>
          </div>
          <button onClick={()=>take(r.id,true)}>Approve</button>
          <button onClick={()=>take(r.id,false)} style={{background:"#fee", border:"1px solid #fbb"}}>Deny</button>
        </div>
      ))}
    </main>
  );
}
