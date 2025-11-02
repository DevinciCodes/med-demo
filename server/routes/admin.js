// server/routes/admin.js
const express = require("express");
const { admin } = require("../firebaseAdmin");

const router = express.Router();
const db = admin.firestore();

/** ----- middleware: require admin custom claim ----- */
async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });

    const decoded = await admin.auth().verifyIdToken(token);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

/**
 * Collections:
 * - ProviderApplications (pending)
 *    { name?, firstName?, lastName?, email, institution, created_at|createdAt, status:"pending" }
 * - Providers (approved/active)
 *    { uid, email, firstName?, lastName?, name?, institution, approved_at|approvedAt, status }
 */

/** GET /api/admin/pending_providers */
// server/routes/admin.js (pending endpoint only)
router.get("/pending_providers", requireAdmin, async (_req, res) => {
  try {
    const db = admin.firestore();
    const snap = await db.collection("ProviderApplications").get();

    const rows = snap.docs
      .map(d => {
        const data = d.data() || {};
        const createdAt =
          data.createdAt?.toDate?.() || data.created_at?.toDate?.() || null;
        const name =
          data.name || [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
        const status = (data.status || "pending").toLowerCase();
        return {
          id: d.id,
          name: name || "—",
          email: data.email || "—",
          institution: data.institution || "—",
          created_at: createdAt,
          status,
        };
      })
      .filter(r => r.status === "pending")
      .sort((a, b) => (b.created_at?.getTime?.() || 0) - (a.created_at?.getTime?.() || 0));

    res.json(rows);
  } catch (e) {
    console.error("pending_providers error:", e);
    res.status(500).json({ message: "Failed to load pending providers" });
  }
});


/** POST /api/admin/approve_provider  { provider_id, approve } */
// server/routes/admin.js (approve endpoint)
router.post("/approve_provider", requireAdmin, async (req, res) => {
  try {
    const { provider_id, approve } = req.body || {};
    if (!provider_id || typeof approve !== "boolean") {
      return res.status(400).json({ message: "provider_id and approve are required" });
    }

    const db = admin.firestore();
    const appRef = db.collection("ProviderApplications").doc(provider_id);
    const appSnap = await appRef.get();
    if (!appSnap.exists) return res.status(404).json({ message: "Application not found" });
    const app = appSnap.data();

    if (!approve) {
      await appRef.delete();
      return res.json({ ok: true, denied: true });
    }

    // enable/create auth user
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(app.email);
      if (userRecord.disabled) {
        await admin.auth().updateUser(userRecord.uid, { disabled: false });
      }
    } catch {
      userRecord = await admin.auth().createUser({
        email: app.email,
        password: "Temp!" + Math.random().toString(36).slice(-8),
      });
    }

    const fullName = app.name || [app.firstName, app.lastName].filter(Boolean).join(" ").trim();

    // write to Providers
    const provRef = db.collection("Providers").doc(userRecord.uid);
    await provRef.set({
      uid: userRecord.uid,
      email: app.email,
      institution: app.institution || "",
      firstName: app.firstName || "",
      lastName: app.lastName || "",
      name: fullName || "",
      createdAt: app.createdAt || app.created_at || admin.firestore.FieldValue.serverTimestamp(),
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "approved",
    }, { merge: true });

    await appRef.delete();
    res.json({ ok: true, uid: userRecord.uid });
  } catch (e) {
    console.error("approve_provider error:", e);
    res.status(500).json({ message: "Failed to approve/deny provider" });
  }
});


/** GET /api/admin/active_providers */
router.get("/active_providers", requireAdmin, async (_req, res) => {
  try {
    const snap = await db.collection("Providers").get();

    const rows = snap.docs
      .map((d) => {
        const data = d.data() || {};
        const approvedAt =
          data.approvedAt?.toDate?.() ||
          data.approved_at?.toDate?.() ||
          null;

        const name =
          data.name ||
          [data.firstName, data.lastName].filter(Boolean).join(" ").trim();

        const status = (data.status || "approved").toLowerCase();

        return {
          id: d.id,
          uid: data.uid || d.id,
          name: name || "—",
          email: data.email || "—",
          institution: data.institution || "—",
          approved_at: approvedAt,
          status,
        };
      })
      .filter((r) => r.status === "approved" || r.status === "active")
      .sort(
        (a, b) =>
          (b.approved_at?.getTime?.() || 0) - (a.approved_at?.getTime?.() || 0)
      );

    res.json(rows);
  } catch (e) {
    console.error("active_providers error:", e);
    res.status(500).json({ message: "Failed to load active providers" });
  }
});

/** POST /api/admin/delete_provider  { provider_id } */
router.post("/delete_provider", requireAdmin, async (req, res) => {
  try {
    const { provider_id } = req.body || {};
    if (!provider_id)
      return res.status(400).json({ message: "provider_id is required" });

    const provRef = db.collection("Providers").doc(provider_id);
    const provSnap = await provRef.get();
    if (!provSnap.exists) {
      return res.status(404).json({ message: "Provider not found" });
    }
    const data = provSnap.data() || {};

    // try disabling the auth user by uid; fallback to email
    try {
      await admin.auth().updateUser(provider_id, { disabled: true });
    } catch {
      if (data.email) {
        try {
          const ur = await admin.auth().getUserByEmail(data.email);
          await admin.auth().updateUser(ur.uid, { disabled: true });
        } catch (e2) {
          console.warn("Could not disable auth user by email:", e2.message);
        }
      }
    }

    // soft delete
    await provRef.set(
      {
        status: "deleted",
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("delete_provider error:", e);
    res.status(500).json({ message: "Failed to delete provider" });
  }
});

module.exports = router;
