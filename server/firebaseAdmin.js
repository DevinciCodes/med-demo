// server/firebaseAdmin.js
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

if (!admin.apps.length) {
  try {
    // ✅ Look inside server/keys/serviceAccount.json
    const serviceAccountPath = path.join(__dirname, "keys", "serviceAccount.json");

    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        `Service account file not found at: ${serviceAccountPath}. ` +
        `Make sure server/keys/serviceAccount.json exists.`
      );
    }

    const serviceAccount = require(serviceAccountPath);

    console.log("[firebaseAdmin] using service account:", serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id, // "pillars-e65ea"
    });
  } catch (e) {
    console.error("[firebaseAdmin] Failed to load service account:", e);
    throw e;
  }
}

module.exports = { admin };
