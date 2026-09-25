import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from './UserManagement';
import DepartmentManagement from './DepartmentManagement';
import EvaluationTemplates from './EvaluationTemplates';
import EvaluationInitiation from './EvaluationInitiation';
import BulkInitiation from './BulkInitiation';

import { LayoutDashboard, Users, Building2, ClipboardList, Target, FileSpreadsheet, Sparkles, Inbox } from 'lucide-react';

const navItems = [
  { key: 'dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard size={18} /> },
  { key: 'users', label: 'User Management', icon: <Users size={18} /> },
  { key: 'departments', label: 'Department Management', icon: <Building2 size={18} /> },
  { key: 'templates', label: 'Evaluation Templates', icon: <ClipboardList size={18} /> },
  { key: 'initiation', label: 'Manual Initiation', icon: <Target size={18} /> },
  { key: 'bulk-initiation', label: 'Bulk Initiation (CSV)', icon: <FileSpreadsheet size={18} /> },
];

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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/evaluate/calculate`, {
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
      <div className="w-full md:w-64 shrink-0">
        <div className="glass-card p-3 flex flex-col gap-1.5" style={{ position: 'sticky', top: '80px' }}>
          <div className="px-4 py-2 mb-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(167, 139, 250, 0.6)' }}>Navigation</p>
          </div>
          {navItems.map(item => (
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

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {activeTab === 'dashboard' && (
          <div className="space-y-6" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
            {/* Stats */}
            <div className="glass-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text m-0">HR Overview</h2>
                <span className="badge badge-info">Live</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="stat-card">
                  <div className="stat-value">{stats.initiated}</div>
                  <p className="stat-label">Total Initiated</p>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.completed}</div>
                  <p className="stat-label">Completed</p>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.avgScore}%</div>
                  <p className="stat-label">Avg Org Score</p>
                </div>
              </div>
            </div>

            {/* Active Evaluation Cycles */}
            <div className="glass-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold m-0" style={{ color: '#e2e8f0' }}>Active Evaluation Cycles</h3>
                <span className="text-xs font-semibold" style={{ color: 'rgba(167, 139, 250, 0.5)' }}>
                  {evaluations.length} cycle{evaluations.length !== 1 ? 's' : ''}
                </span>
              </div>
              <hr className="section-divider" style={{ margin: '0 0 1.25rem 0' }} />

              <div className="space-y-3">
                {evaluations.map(e => (
                  <div key={e.id} className="eval-item flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-base mb-1" style={{ color: '#e2e8f0' }}>{e.cycleId}</h4>
                      <p className="text-xs mb-1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Target: {e.targetUserEmail}</p>
                      <span className={`badge ${e.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                        {e.status}
                      </span>
                    </div>
                    {e.status !== 'Completed' && (
                      <button 
                        onClick={() => handleCalculateScore(e.cycleId)}
                        disabled={calculating}
                        className="btn-secondary px-4 py-2 text-xs flex items-center gap-1.5 whitespace-nowrap"
                      >
                        {calculating ? 'Processing...' : <><Sparkles size={14} /> Finalize & Calculate</>}
                      </button>
                    )}
                  </div>
                ))}
                {evaluations.length === 0 && (
                  <div className="text-center py-10" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                    <div className="flex justify-center mb-3">
                      <Inbox size={32} opacity={0.5} />
                    </div>
                    <p className="font-medium">No evaluation cycles found.</p>
                    <p className="text-xs mt-1">Start by creating a new evaluation.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'departments' && <DepartmentManagement />}
        {activeTab === 'templates' && <EvaluationTemplates />}
        {activeTab === 'initiation' && <EvaluationInitiation />}
        {activeTab === 'bulk-initiation' && <BulkInitiation />}
      </div>
    </div>
  );
}
