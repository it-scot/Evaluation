const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

// The user needs to download their serviceAccountKey.json from Firebase Console
// and place it in the server directory, or use environment variables.
// For now, we will assume it's loaded from a file or environment.
try {
  const serviceAccount = require("./serviceAccountKey.json");

  initializeApp({
    credential: cert(serviceAccount)
  });
} catch (error) {
  console.warn("WARNING: Firebase Admin initialization failed. Error:", error.message);
  // Initialize without credentials for now, will fail on actual calls but allows server to start
  try {
    initializeApp();
  } catch(e) {}
}

const db = getFirestore();
const auth = getAuth();

module.exports = { db, auth };
