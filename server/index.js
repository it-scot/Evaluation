require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const { admin, db } = require("./firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
};

// Route: Upload users CSV
app.post("/api/users/upload", verifyToken, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        const batch = db.batch();
        const usersRef = db.collection("users");

        for (const user of results) {
          if (!user.email || !user.email.endsWith("@scot.lk")) {
             continue; // Skip invalid or non-scot domain emails
          }
          
          // Create or update user in Firestore
          const docRef = usersRef.doc(user.email);
          batch.set(docRef, {
            name: user.name || "",
            email: user.email,
            department: user.department || "",
            designation: user.designation || "",
            role: user.role || "employee", // Admin, Management, Employee
          }, { merge: true });
        }

        await batch.commit();
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({ message: "Users imported successfully", count: results.length });
      } catch (error) {
        console.error("Error importing users:", error);
        res.status(500).json({ error: "Failed to import users" });
      }
    });
});

// Calculate Weighted Score
app.post("/api/evaluate/calculate", verifyToken, async (req, res) => {
  const { cycleId } = req.body;
  
  if (!cycleId) {
    return res.status(400).json({ error: "Cycle ID is required" });
  }

  try {
    // Get all responses for this cycle
    const responsesSnap = await db.collection("responses").where("cycleId", "==", cycleId).get();
    
    if (responsesSnap.empty) {
      return res.status(404).json({ error: "No responses found for this evaluation cycle" });
    }

    let primaryScore = null;
    let selfScore = null;
    let peerScores = [];
    
    // Group responses by assignment type
    for (const doc of responsesSnap.docs) {
      const resp = doc.data();
      const assignSnap = await db.collection("assignments").doc(resp.assignmentId).get();
      if (!assignSnap.exists) continue;
      
      const assignData = assignSnap.data();
      const type = assignData.type;
      
      if (type === "Primary Evaluator") {
        primaryScore = resp.percentageScore;
      } else if (type === "Self-Evaluation") {
        selfScore = resp.percentageScore;
      } else if (type.includes("Peer")) {
        peerScores.push(resp.percentageScore);
      }
    }
    
    // Calculate final weighted score
    // Primary: 75%, Peer Group Avg: 20%, Self: 5%
    let finalScore = 0;
    let computedParts = [];
    
    if (primaryScore !== null) {
      finalScore += primaryScore * 0.75;
      computedParts.push("Primary");
    }
    
    if (selfScore !== null) {
      finalScore += selfScore * 0.05;
      computedParts.push("Self");
    }
    
    if (peerScores.length > 0) {
      const peerAvg = peerScores.reduce((a, b) => a + b, 0) / peerScores.length;
      finalScore += peerAvg * 0.20;
      computedParts.push("Peers");
    }
    
    // If not all parts are present, this is a partial score. We could scale it to 100% based on what is available, but the system requirement implies standard weights. Assuming all are completed.
    
    // Save to the evaluation cycle document
    const evalSnap = await db.collection("evaluations").where("cycleId", "==", cycleId).get();
    if (!evalSnap.empty) {
      const evalDoc = evalSnap.docs[0];
      await evalDoc.ref.update({
        finalScore,
        status: "Completed",
        computedParts,
        completedAt: new Date().toISOString()
      });
    }

    res.json({ message: "Score calculated successfully", finalScore });
  } catch (error) {
    console.error("Error calculating score:", error);
    res.status(500).json({ error: "Failed to calculate score" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
