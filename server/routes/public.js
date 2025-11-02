// server/routes/public.js
const express = require("express");
const { admin } = require("../firebaseAdmin");

const router = express.Router();

/**
 * POST /api/public/provider_register
 * body: { firstName, lastName, email, password, institution }
 * Writes pending to ProviderApplications; Auth user is disabled.
 */
router.post("/provider_register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, institution } = req.body || {};
    if (!firstName || !lastName || !email || !password || !institution) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      disabled: true,
    });

    const db = admin.firestore();
    await db.collection("ProviderApplications").doc(userRecord.uid).set({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email,
      institution,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("[public] provider_register OK:", userRecord.uid);
    res.json({ ok: true, uid: userRecord.uid });
  } catch (e) {
    console.error("provider_register error:", e);
    res.status(500).json({ message: "Failed to register provider" });
  }
});

module.exports = router;
