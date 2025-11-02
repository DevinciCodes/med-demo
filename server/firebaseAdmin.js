const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

if (!admin.apps.length) {
  // 1) Try GOOGLE_APPLICATION_CREDENTIALS (file path)
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : null;

  let credential;

  try {
    if (credsPath && fs.existsSync(credsPath)) {
      const key = require(credsPath);
      credential = admin.credential.cert(key);
      console.log("[firebaseAdmin] using service account file:", credsPath);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // 2) Or try JSON string in env
      const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(key);
      console.log("[firebaseAdmin] using service account from env JSON");
    } else {
      // 3) Fallback to ADC (gcloud / Cloud Run / etc.)
      credential = admin.credential.applicationDefault();
      console.log("[firebaseAdmin] using applicationDefault credentials");
    }
  } catch (e) {
    console.error("[firebaseAdmin] credential init failed:", e);
    throw e;
  }

  admin.initializeApp({ credential });
}

module.exports = { admin };
