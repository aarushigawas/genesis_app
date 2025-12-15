const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Load service account key
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function approvePasswordChange(uid, newPassword) {
  try {
    // 1. Update password in Firebase Auth
    await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    // 2. Mark request as approved in Firestore
    await db.collection("passwordChangeRequests").doc(uid).update({
      status: "approved",
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Password updated and request approved for:", uid);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error approving password:", err);
    process.exit(1);
  }
}

/*
  USAGE:
  node approvePassword.js <UID> <NEW_PASSWORD>
*/

const [, , uid, newPassword] = process.argv;

if (!uid || !newPassword) {
  console.log("Usage: node approvePassword.js <UID> <NEW_PASSWORD>");
  process.exit(1);
}

approvePasswordChange(uid, newPassword);
