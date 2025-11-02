// server/routes/provider.js
const express = require("express");
const { admin } = require("../firebaseAdmin");

const router = express.Router();

/**
 * POST /api/provider/create_patient
 * body: { email, firstName, lastName, dob, phone, allergies, tempPassword, providerId, providerEmail }
 * - Creates/updates Auth user (email + tempPassword)
 * - Writes Firestore doc: Patients/{uid} with mustReset: true
 */
router.post("/create_patient", async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      dob = "",
      phone = "",
      allergies = [],
      tempPassword,
      providerId = null,
      providerEmail = null,
    } = req.body || {};

    if (!email || !tempPassword) {
      return res.status(400).json({ message: "email and tempPassword are required" });
    }

    // 1) Create or update Auth user with temp password
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(userRecord.uid, { password: tempPassword });
    } catch {
      userRecord = await admin.auth().createUser({ email, password: tempPassword });
    }

    // 2) Write Firestore patient doc (Capital P in collection name)
    const db = admin.firestore();
    await db.doc(`Patients/${userRecord.uid}`).set(
      {
        email,
        firstName,
        lastName,
        name: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
        dob,
        phone,
        allergies,
        status: "active",
        mustReset: true, // <-- Home.jsx checks this to force reset
        providerId,
        providerEmail,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 3) Never store tempPassword in Firestore
    return res.json({ ok: true, uid: userRecord.uid });
  } catch (e) {
    console.error("create_patient error:", e);
    return res.status(500).json({ message: "Failed to create patient" });
  }
});

module.exports = router;
