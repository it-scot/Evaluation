require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const { db, auth } = require("./firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Middleware to verify Firebase Auth Token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
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

// Route: Bulk Initiate Evaluations from Department CSV
app.post("/api/evaluate/bulk-initiate", verifyToken, upload.single("file"), (req, res) => {
  const { selfTemplateId, primaryTemplateId, upLevelTemplateId, sameLevelTemplateId } = req.body;
  
  if (!req.file || !selfTemplateId || !primaryTemplateId || !upLevelTemplateId || !sameLevelTemplateId) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Missing file or template IDs" });
  }

  const employees = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => {
      // Must have email, name, and hierarchy_level
      if (data.email && data.email.endsWith("@scot.lk")) {
         employees.push({
           email: data.email,
           name: data.name || "",
           department: data.department || "",
           designation: data.designation || "",
           hierarchy_level: parseInt(data.hierarchy_level) || 1
         });
      }
    })
    .on("end", async () => {
      fs.unlinkSync(req.file.path); // Clean up file
      
      if (employees.length === 0) {
        return res.status(400).json({ error: "No valid employees found in CSV" });
      }

      try {
        const batch = db.batch();
        
        // 1. Ensure all users exist in users collection (for login/metadata)
        const usersRef = db.collection("users");
        for (const emp of employees) {
          batch.set(usersRef.doc(emp.email), {
            name: emp.name,
            email: emp.email,
            department: emp.department,
            designation: emp.designation,
            role: "employee", // Default role
            hierarchy_level: emp.hierarchy_level
          }, { merge: true });
        }

        // 2. Find Primary Evaluator (HoD) - the one with the highest hierarchy_level
        const primaryEvaluator = employees.reduce((prev, current) => 
          (prev.hierarchy_level > current.hierarchy_level) ? prev : current
        );

        // 3. For each employee, generate the cycle and assignments
        for (const emp of employees) {
          const cycleId = `bulk_${Date.now()}_${Math.floor(Math.random()*1000)}`;
          
          // Add to evaluations collection (We can just use primaryTemplateId here as a placeholder since assignments have their own templates now)
          const evalRef = db.collection("evaluations").doc();
          batch.set(evalRef, {
            cycleId,
            targetUserId: emp.email,
            targetUserEmail: emp.email,
            templateId: primaryTemplateId, // Kept for backwards compatibility 
            status: "Initiated",
            createdAt: new Date().toISOString()
          });

          // A helper to assign
          const addAssign = (evaluatorId, type, weight, specificTemplateId) => {
             const assignRef = db.collection("assignments").doc();
             batch.set(assignRef, {
               cycleId,
               targetUserId: emp.email,
               evaluatorId,
               templateId: specificTemplateId,
               type,
               weight,
               status: "Pending"
             });
          };

          // 3a. Self Evaluation
          addAssign(emp.email, "Self-Evaluation", 5, selfTemplateId);

          // 3b. Primary Evaluator
          addAssign(primaryEvaluator.email, "Primary Evaluator", 75, primaryTemplateId);

          // Find available peers (excluding self)
          const otherEmployees = employees.filter(e => e.email !== emp.email);
          
          // 3c. 2 Up-Level Peers
          let upLevelPeers = otherEmployees.filter(e => e.hierarchy_level > emp.hierarchy_level);
          // Shuffle and pick 2
          upLevelPeers.sort(() => 0.5 - Math.random());
          const selectedUpPeers = upLevelPeers.slice(0, 2);
          
          // Fallback if not enough up-level peers: use same/sub level
          if (selectedUpPeers.length < 2) {
             const needed = 2 - selectedUpPeers.length;
             let fallbacks = otherEmployees
                .filter(e => e.hierarchy_level <= emp.hierarchy_level && !selectedUpPeers.includes(e));
             fallbacks.sort(() => 0.5 - Math.random());
             selectedUpPeers.push(...fallbacks.slice(0, needed));
          }
          
          for (const peer of selectedUpPeers) {
             addAssign(peer.email, "Peer (Up-Level)", 5, upLevelTemplateId);
          }

          // 3d. 2 Same/Sub-Level Peers
          let sameSubPeers = otherEmployees
            .filter(e => e.hierarchy_level <= emp.hierarchy_level && !selectedUpPeers.includes(e));
          sameSubPeers.sort(() => 0.5 - Math.random());
          const selectedSamePeers = sameSubPeers.slice(0, 2);
          
          // Fallback if not enough same level: use anyone remaining
          if (selectedSamePeers.length < 2) {
             const needed = 2 - selectedSamePeers.length;
             let fallbacks = otherEmployees
                .filter(e => !selectedUpPeers.includes(e) && !selectedSamePeers.includes(e));
             fallbacks.sort(() => 0.5 - Math.random());
             selectedSamePeers.push(...fallbacks.slice(0, needed));
          }
          
          for (const peer of selectedSamePeers) {
             addAssign(peer.email, "Peer (Same/Sub)", 5, sameLevelTemplateId);
          }
        }

        await batch.commit();
        res.json({ message: "Bulk initiation successful", totalProcessed: employees.length });

      } catch (error) {
        console.error("Error in bulk initiation:", error);
        res.status(500).json({ error: "Failed to perform bulk initiation" });
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
