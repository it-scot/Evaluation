const { db } = require("./firebase-admin");

async function cleanDB() {
  console.log("Starting database cleanup...");

  const collections = ["evaluations", "assignments", "responses"];

  for (const collectionName of collections) {
    const snap = await db.collection(collectionName).get();
    
    if (snap.size === 0) {
      console.log(`Collection ${collectionName} is already empty.`);
      continue;
    }

    const batch = db.batch();
    snap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snap.size} documents from ${collectionName}`);
  }
  
  // Clean non-admin users
  const usersSnap = await db.collection("users").get();
  const adminEmails = ["it@scot.lk", "admin@scot.lk", "sheran@scot.lk"];
  let usersDeleted = 0;
  
  const userBatch = db.batch();
  usersSnap.docs.forEach((doc) => {
    const email = doc.id;
    if (!adminEmails.includes(email)) {
      userBatch.delete(doc.ref);
      usersDeleted++;
    }
  });
  
  if (usersDeleted > 0) {
    await userBatch.commit();
    console.log(`Deleted ${usersDeleted} non-admin users from users collection`);
  } else {
    console.log("No non-admin users to delete.");
  }

  console.log("Database cleanup complete!");
  process.exit(0);
}

cleanDB().catch(console.error);
