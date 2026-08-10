import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export default function EvaluationInitiation() {
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  // Form State
  const [targetUserId, setTargetUserId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [primaryEvaluatorId, setPrimaryEvaluatorId] = useState('');
  const [peerUp1, setPeerUp1] = useState('');
  const [peerUp2, setPeerUp2] = useState('');
  const [peerSame1, setPeerSame1] = useState('');
  const [peerSame2, setPeerSame2] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userSnap = await getDocs(collection(db, 'users'));
        setUsers(userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const templateSnap = await getDocs(collection(db, 'templates'));
        setTemplates(templateSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const targetUser = users.find(u => u.id === targetUserId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const cycleId = `eval_${Date.now()}`;
      
      // We will create assignment records for each evaluator
      const assignments = [
        { evaluatorId: targetUserId, type: 'Self-Evaluation', weight: 5 },
        { evaluatorId: primaryEvaluatorId, type: 'Primary Evaluator', weight: 75 },
        { evaluatorId: peerUp1, type: 'Peer (Up-Level)', weight: 5 },
        { evaluatorId: peerUp2, type: 'Peer (Up-Level)', weight: 5 },
        { evaluatorId: peerSame1, type: 'Peer (Same/Sub)', weight: 5 },
        { evaluatorId: peerSame2, type: 'Peer (Same/Sub)', weight: 5 }
      ];

      // Store the main evaluation cycle
      await addDoc(collection(db, 'evaluations'), {
        cycleId,
        targetUserId,
        targetUserEmail: targetUser.email,
        templateId,
        status: 'Initiated',
        createdAt: new Date().toISOString()
      });

      // Store individual assignments
      for (const assign of assignments) {
        if (assign.evaluatorId) {
          await addDoc(collection(db, 'assignments'), {
            cycleId,
            targetUserId,
            evaluatorId: assign.evaluatorId,
            templateId,
            type: assign.type,
            weight: assign.weight,
            status: 'Pending'
          });
        }
      }

      setMessage("Evaluation initiated successfully!");
      // Reset form
      setTargetUserId(''); setTemplateId(''); setPrimaryEvaluatorId('');
      setPeerUp1(''); setPeerUp2(''); setPeerSame1(''); setPeerSame2('');
    } catch (error) {
      console.error("Error initiating evaluation:", error);
      setMessage("Failed to initiate evaluation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-4xl mx-auto">
      <h2 className="mb-6">Evaluation Initiation</h2>
      
      {message && (
        <div className="mb-6 p-4 bg-gray-100 border border-black font-medium text-center">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Target Employee */}
          <div className="border border-gray-200 p-4 bg-gray-50">
            <h3 className="mb-4 text-lg border-b pb-2">Evaluatee Details</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Employee Name</label>
              <select 
                value={targetUserId} 
                onChange={(e) => setTargetUserId(e.target.value)}
                required
              >
                <option value="">Select Employee...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </div>

            <div className="mb-4 opacity-70">
              <label className="block text-sm font-medium mb-1">Department</label>
              <input type="text" value={targetUser?.department || ''} readOnly className="bg-gray-100 cursor-not-allowed" />
            </div>

            <div className="opacity-70">
              <label className="block text-sm font-medium mb-1">Designation</label>
              <input type="text" value={targetUser?.designation || ''} readOnly className="bg-gray-100 cursor-not-allowed" />
            </div>
          </div>

          {/* Form & Primary */}
          <div className="border border-gray-200 p-4 bg-gray-50">
            <h3 className="mb-4 text-lg border-b pb-2">Evaluation Setup</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Evaluation Form Template</label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} required>
                <option value="">Select Template...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Primary Evaluator (HoD / Manager)</label>
              <select value={primaryEvaluatorId} onChange={(e) => setPrimaryEvaluatorId(e.target.value)} required>
                <option value="">Select Primary Evaluator...</option>
                {users.filter(u => u.id !== targetUserId).map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Peers */}
        <div className="border border-gray-200 p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="mb-4 text-lg border-b pb-2">Peer Evaluators (Up-Level)</h3>
            <div className="space-y-4">
              <select value={peerUp1} onChange={(e) => setPeerUp1(e.target.value)} required>
                <option value="">Employee 1 Name</option>
                {users.filter(u => u.id !== targetUserId).map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
              <select value={peerUp2} onChange={(e) => setPeerUp2(e.target.value)} required>
                <option value="">Employee 2 Name</option>
                {users.filter(u => u.id !== targetUserId).map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <h3 className="mb-4 text-lg border-b pb-2">Peer Evaluators (Same/Subordinate)</h3>
            <div className="space-y-4">
              <select value={peerSame1} onChange={(e) => setPeerSame1(e.target.value)} required>
                <option value="">Employee 1 Name</option>
                {users.filter(u => u.id !== targetUserId).map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
              <select value={peerSame2} onChange={(e) => setPeerSame2(e.target.value)} required>
                <option value="">Employee 2 Name</option>
                {users.filter(u => u.id !== targetUserId).map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button type="button" onClick={() => window.location.reload()} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Processing...' : 'Initiate Evaluation'}
          </button>
        </div>
      </form>
    </div>
  );
}
