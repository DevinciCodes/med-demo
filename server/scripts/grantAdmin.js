// server/scripts/grantAdmin.js
const path = require("path");
// Load server/.env explicitly (works no matter where you run the script from)
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const { admin } = require("../firebaseAdmin");

(async () => {
  try {
    const email = process.argv[2];
    if (!email) {
      console.error("Usage: node scripts/grantAdmin.js <admin-email>");
      process.exit(1);
    }
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { role: "admin" });
    console.log(`✅ Granted admin role to ${email}`);
    process.exit(0);
  } catch (e) {
    console.error("❌ grantAdmin failed:", e.message);
    process.exit(1);
  }
})();
