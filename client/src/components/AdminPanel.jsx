import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from './UserManagement';
import DepartmentManagement from './DepartmentManagement';
import EvaluationTemplates from './EvaluationTemplates';
import EvaluationInitiation from './EvaluationInitiation';

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ initiated: 0, completed: 0, avgScore: 0 });
  const [evaluations, setEvaluations] = useState([]);
  const [calculating, setCalculating] = useState(false);

  const fetchStats = async () => {
    try {
      const snap = await getDocs(collection(db, 'evaluations'));
      const evals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      let initiated = evals.length;
      let completed = evals.filter(e => e.status === 'Completed').length;
      
      let totalScore = 0;
      let scoredCount = 0;
      evals.forEach(e => {
        if (e.finalScore !== undefined) {
          totalScore += e.finalScore;
          scoredCount++;
        }
      });
      
      const avgScore = scoredCount > 0 ? (totalScore / scoredCount).toFixed(1) : 0;
      
      setStats({ initiated, completed, avgScore });
      setEvaluations(evals);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab]);

  const handleCalculateScore = async (cycleId) => {
    setCalculating(true);
    try {
      const token = await user.getIdToken();
      // Adjust URL as needed
      const res = await fetch('http://localhost:5000/api/evaluate/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cycleId })
      });
      if (res.ok) {
        alert("Score calculated successfully!");
        fetchStats();
      } else {
        alert("Failed to calculate score");
      }
    } catch (error) {
      console.error(error);
      alert("Error calculating score");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`text-left px-4 py-3 border transition-colors ${activeTab === 'dashboard' ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}
        >
          Dashboard Overview
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`text-left px-4 py-3 border transition-colors ${activeTab === 'users' ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}
        >
          User Management
        </button>
        <button 
          onClick={() => setActiveTab('departments')}
          className={`text-left px-4 py-3 border transition-colors ${activeTab === 'departments' ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}
        >
          Department Management
        </button>
        <button 
          onClick={() => setActiveTab('templates')}
          className={`text-left px-4 py-3 border transition-colors ${activeTab === 'templates' ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}
        >
          Evaluation Templates
        </button>
        <button 
          onClick={() => setActiveTab('initiation')}
          className={`text-left px-4 py-3 border transition-colors ${activeTab === 'initiation' ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}
        >
          Evaluation Initiation
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="mb-6">HR Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 p-6 text-center bg-gray-50">
                  <h3 className="text-4xl mb-2">{stats.initiated}</h3>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Total Initiated</p>
                </div>
                <div className="border border-gray-200 p-6 text-center bg-gray-50">
                  <h3 className="text-4xl mb-2">{stats.completed}</h3>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Completed</p>
                </div>
                <div className="border border-gray-200 p-6 text-center bg-gray-50">
                  <h3 className="text-4xl mb-2">{stats.avgScore}%</h3>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Avg Org Score</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl mb-4 border-b pb-2">Active Evaluation Cycles</h3>
              <div className="space-y-4">
                {evaluations.map(e => (
                  <div key={e.id} className="border border-gray-200 p-4 flex justify-between items-center bg-gray-50">
                    <div>
                      <h4 className="font-semibold">{e.cycleId}</h4>
                      <p className="text-sm text-gray-500">Target: {e.targetUserEmail}</p>
                      <p className="text-sm text-gray-500">Status: <span className="font-medium text-black">{e.status}</span></p>
                    </div>
                    {e.status !== 'Completed' && (
                      <button 
                        onClick={() => handleCalculateScore(e.cycleId)}
                        disabled={calculating}
                        className="btn-secondary px-4 py-2"
                      >
                        {calculating ? 'Processing...' : 'Finalize & Calculate Score'}
                      </button>
                    )}
                  </div>
                ))}
                {evaluations.length === 0 && <p className="text-gray-500 italic">No evaluation cycles found.</p>}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'departments' && <DepartmentManagement />}
        {activeTab === 'templates' && <EvaluationTemplates />}
        {activeTab === 'initiation' && <EvaluationInitiation />}
      </div>
    </div>
  );
}
