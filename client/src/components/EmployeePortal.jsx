import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import EvaluationForm from './EvaluationForm';
import ResultsPortal from './ResultsPortal';

export default function EmployeePortal() {
  const { user, userData } = useAuth();
  const [pendingEvaluations, setPendingEvaluations] = useState([]);
  const [completedEvaluations, setCompletedEvaluations] = useState([]);
  const [activeEvaluation, setActiveEvaluation] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchAssignments = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'assignments'), 
        where('evaluatorId', '==', user.email)
      );
      const snapshot = await getDocs(q);
      
      const pending = [];
      const completed = [];
      
      for (const d of snapshot.docs) {
        const data = d.data();
        
        // Fetch cycle details to get target user email
        const cycleSnap = await getDocs(query(collection(db, 'evaluations'), where('cycleId', '==', data.cycleId)));
        let targetName = data.targetUserId;
        if (!cycleSnap.empty) {
            targetName = cycleSnap.docs[0].data().targetUserEmail;
        }

        const assignmentData = { id: d.id, ...data, targetName };
        if (data.status === 'Pending') {
          pending.push(assignmentData);
        } else {
          completed.push(assignmentData);
        }
      }
      
      setPendingEvaluations(pending);
      setCompletedEvaluations(completed);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  if (activeEvaluation) {
    return (
      <EvaluationForm 
        assignment={activeEvaluation} 
        onBack={() => {
          setActiveEvaluation(null);
          fetchAssignments();
        }} 
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
      
      {/* Sidebar for Navigation (matches Admin panel style) */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`text-left px-4 py-3 border transition-colors ${activeTab === 'dashboard' ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}
        >
          My Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          className={`text-left px-4 py-3 border transition-colors ${activeTab === 'results' ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}
        >
          My Final Scores
        </button>
      </div>

      <div className="flex-1 space-y-6">
        {activeTab === 'dashboard' && (
          <>
            <div className="card">
              <h2 className="mb-6 border-b pb-4">Pending Evaluations</h2>
              <div className="space-y-4">
                {pendingEvaluations.map(assign => (
                  <div key={assign.id} className="flex justify-between items-center p-4 border border-gray-200 bg-gray-50 hover:bg-white transition-colors">
                    <div>
                      <h4 className="font-bold">{assign.type}</h4>
                      <p className="text-sm text-gray-600">For: {assign.targetName}</p>
                    </div>
                    <button 
                      onClick={() => setActiveEvaluation(assign)}
                      className="btn-primary px-4 py-1"
                    >
                      Start
                    </button>
                  </div>
                ))}
                {pendingEvaluations.length === 0 && (
                  <p className="text-gray-500 italic">No pending evaluations.</p>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="mb-6 border-b pb-4">Completed Evaluations</h2>
              <div className="space-y-4">
                {completedEvaluations.map(assign => (
                  <div key={assign.id} className="flex justify-between items-center p-4 border border-gray-200 bg-white opacity-60">
                    <div>
                      <h4 className="font-bold text-gray-700">{assign.type}</h4>
                      <p className="text-sm text-gray-500">For: {assign.targetName}</p>
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-wider text-green-700 bg-green-50 px-3 py-1 border border-green-200">
                      Completed
                    </span>
                  </div>
                ))}
                {completedEvaluations.length === 0 && (
                  <p className="text-gray-500 italic">No completed evaluations yet.</p>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'results' && <ResultsPortal />}
      </div>
    </div>
  );
}
