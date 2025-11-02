// src/pages/Admin.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import "../styles/admin.css";

export default function Admin() {
  const { user } = useAuth();

  const [pending, setPending] = useState([]);
  const [active, setActive] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // Load both tables
  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const [p, a] = await Promise.all([
        api("/api/admin/pending_providers"),
        api("/api/admin/active_providers"),
      ]);
      setPending(p || []);
      setActive(a || []);
    } catch (e) {
      setErr(e.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Approve or deny a pending provider
  const take = async (id, approve = true) => {
    try {
      await api("/api/admin/approve_provider", {
        method: "POST",
        body: { provider_id: id, approve },
      });
      await load();
    } catch (e) {
      setErr(e.message || "Failed to update provider");
    }
  };

  // Delete an active provider
  const removeProvider = async (id) => {
    const ok = window.confirm(
      "Are you sure you want to delete this provider's account?"
    );
    if (!ok) return;
    try {
      await api("/api/admin/delete_provider", {
        method: "POST",
        body: { provider_id: id },
      });
      await load();
    } catch (e) {
      setErr(e.message || "Failed to delete provider");
    }
  };

  return (
    <main className="admin-page">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p>Signed in as Admin: {user?.email || "—"}</p>
      </div>

      {err && <div className="error-bar">{err}</div>}

      {/* PENDING PROVIDERS */}
      <section className="admin-card">
        <h2>Pending Providers</h2>
        <p className="admin-helper">
          Review and approve or deny new provider requests.
        </p>

        {loading ? (
          <p className="admin-empty">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="admin-empty">None pending.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Institution</th>
                <th>Requested</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.name || "—"}</strong>
                  </td>
                  <td>{r.email}</td>
                  <td>{r.institution || "—"}</td>
                  <td>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString()
                      : "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="admin-actions">
                      <button
                        className="btn btn-approve"
                        onClick={() => take(r.id, true)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-deny"
                        onClick={() => take(r.id, false)}
                      >
                        Deny
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ACTIVE PROVIDERS */}
      <section className="admin-card">
        <h2>Active Providers</h2>
        <p className="admin-helper">
          Currently approved providers. Remove access if needed.
        </p>

        {loading ? (
          <p className="admin-empty">Loading…</p>
        ) : active.length === 0 ? (
          <p className="admin-empty">No active providers.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Institution</th>
                <th>Approved</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {active.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.name || "—"}</strong>
                  </td>
                  <td>{r.email}</td>
                  <td>{r.institution || "—"}</td>
                  <td>
                    {r.approved_at
                      ? new Date(r.approved_at).toLocaleString()
                      : "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="admin-actions">
                      <button
                        className="btn btn-delete"
                        onClick={() => removeProvider(r.id)}
                      >
                        Delete Account
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
