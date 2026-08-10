const { db } = require("./firebase-admin");

async function fixTemplates() {
  console.log("Fixing templates...");
  const snap = await db.collection("templates").get();
  const batch = db.batch();

  snap.docs.forEach(doc => {
    const data = doc.data();
    let updated = false;
    if (data.questions && Array.isArray(data.questions)) {
      const newQuestions = data.questions.map(q => {
        if (typeof q === 'object' && q !== null && q.text) {
          updated = true;
          return q.text;
        }
        return q;
      });
      if (updated) {
        batch.update(doc.ref, { questions: newQuestions });
      }
    }
  });

  await batch.commit();
  console.log("Templates fixed!");
  process.exit(0);
}

fixTemplates().catch(console.error);
