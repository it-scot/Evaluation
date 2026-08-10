const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

// The user needs to download their serviceAccountKey.json from Firebase Console
// and place it in the server directory, or use environment variables.
// For now, we will assume it's loaded from a file or environment.
try {
  const serviceAccount = require("./serviceAccountKey.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.warn("WARNING: serviceAccountKey.json not found. Firebase Admin not initialized correctly.");
  // Initialize without credentials for now, will fail on actual calls but allows server to start
  admin.initializeApp();
}

const db = getFirestore();

module.exports = { admin, db };
