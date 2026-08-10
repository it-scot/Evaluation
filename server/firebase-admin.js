const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

// The user needs to download their serviceAccountKey.json from Firebase Console
// and place it in the server directory, or use environment variables.
// For now, we will assume it's loaded from a file or environment.
let db = null;
let auth = null;

try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("Found FIREBASE_SERVICE_ACCOUNT env var. Attempting to parse...");
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("Successfully parsed service account JSON.");
  } else {
    console.log("No FIREBASE_SERVICE_ACCOUNT env var, falling back to local file.");
    serviceAccount = require("./serviceAccountKey.json");
  }

  initializeApp({
    credential: cert(serviceAccount)
  });
  console.log("Firebase App initialized successfully.");

  db = getFirestore();
  auth = getAuth();
  console.log("Firestore and Auth initialized.");
} catch (error) {
  console.error("CRITICAL ERROR initializing Firebase Admin:", error.message);
  // Do not crash the entire process, let it start but requests will fail.
}

module.exports = { db, auth };
