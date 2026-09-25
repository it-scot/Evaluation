import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import EvaluationForm from './EvaluationForm';
import ResultsPortal from './ResultsPortal';
import { Home, Trophy, Play, CheckCircle2, ClipboardCheck } from 'lucide-react';

const employeeNavItems = [
  { key: 'dashboard', label: 'My Dashboard', icon: <Home size={18} /> },
  { key: 'results', label: 'My Final Scores', icon: <Trophy size={18} /> },
];

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
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0">
        <div className="glass-card p-3 flex flex-col gap-1.5" style={{ position: 'sticky', top: '80px' }}>
          <div className="px-4 py-2 mb-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(167, 139, 250, 0.6)' }}>Navigation</p>
          </div>
          {employeeNavItems.map(item => (
            <button 
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`nav-btn flex items-center gap-3 ${activeTab === item.key ? 'active' : ''}`}
            >
              <span className="flex items-center justify-center opacity-80">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-6 min-w-0">
        {activeTab === 'dashboard' && (
          <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
            {/* Pending Evaluations */}
            <div className="glass-card mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text m-0">Pending Evaluations</h2>
                {pendingEvaluations.length > 0 && (
                  <span className="badge badge-warning">{pendingEvaluations.length} pending</span>
                )}
              </div>
              <hr className="section-divider" style={{ margin: '0 0 1.25rem 0' }} />

              <div className="space-y-3">
                {pendingEvaluations.map(assign => (
                  <div key={assign.id} className="eval-item flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-base mb-1" style={{ color: '#e2e8f0' }}>
                        {assign.type}
                      </h4>
                      <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                        For: <span style={{ color: '#a78bfa' }}>{assign.targetName}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveEvaluation(assign)}
                      className="btn-primary px-5 py-2 text-xs flex items-center gap-2"
                    >
                      <Play size={14} fill="currentColor" /> Start Evaluation
                    </button>
                  </div>
                ))}
                {pendingEvaluations.length === 0 && (
                  <div className="text-center py-10" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                    <div className="flex justify-center mb-3">
                      <CheckCircle2 size={32} opacity={0.5} />
                    </div>
                    <p className="font-medium">All caught up!</p>
                    <p className="text-xs mt-1">No pending evaluations at this time.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Completed Evaluations */}
            <div className="glass-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold m-0" style={{ color: '#e2e8f0' }}>Completed Evaluations</h2>
                {completedEvaluations.length > 0 && (
                  <span className="badge badge-success">{completedEvaluations.length} done</span>
                )}
              </div>
              <hr className="section-divider" style={{ margin: '0 0 1.25rem 0' }} />

              <div className="space-y-3">
                {completedEvaluations.map(assign => (
                  <div key={assign.id} className="eval-item flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{ opacity: 0.7 }}>
                    <div>
                      <h4 className="font-bold text-base mb-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {assign.type}
                      </h4>
                      <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.35)' }}>
                        For: {assign.targetName}
                      </p>
                    </div>
                    <span className="badge badge-success">
                      ✓ Completed
                    </span>
                  </div>
                ))}
                {completedEvaluations.length === 0 && (
                  <div className="text-center py-10" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                    <div className="flex justify-center mb-3">
                      <ClipboardCheck size={32} opacity={0.5} />
                    </div>
                    <p className="font-medium">No completed evaluations yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && <ResultsPortal />}
      </div>
    </div>
  );
}
