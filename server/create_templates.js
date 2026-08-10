const { db } = require("./firebase-admin");

async function createTemplates() {
  console.log("Creating default templates...");
  const batch = db.batch();

  const templates = [
    { title: "Self Evaluation Template 2026", type: "Self" },
    { title: "Manager Evaluation Template 2026", type: "Primary" },
    { title: "Up-Level Peer Template 2026", type: "Up-Level" },
    { title: "Same-Level Peer Template 2026", type: "Same-Level" },
  ];

  for (const t of templates) {
    const ref = db.collection("templates").doc();
    batch.set(ref, {
      title: t.title,
      questions: [
        { text: `How well does the employee perform in ${t.type} perspective?` },
        { text: "Rate communication skills." },
        { text: "Rate teamwork." }
      ],
      createdAt: new Date().toISOString()
    });
  }

  await batch.commit();
  console.log("Templates created!");
  process.exit(0);
}

createTemplates().catch(console.error);
