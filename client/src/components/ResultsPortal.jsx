import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Star, CheckCircle2, BarChart3, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

export default function ResultsPortal() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'evaluations'), 
          where('targetUserEmail', '==', user.email)
        );
        const snapshot = await getDocs(q);
        
        const resList = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'Completed' || data.finalScore !== undefined) {
             resList.push({ id: doc.id, ...data });
          }
        });
        
        setResults(resList);
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center loading-text">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#a78bfa', borderTopColor: 'transparent' }}></div>
        <p className="font-semibold" style={{ color: '#a78bfa' }}>Loading results...</p>
      </div>
    </div>
  );

  const getRatingInfo = (score) => {
    if (score >= 90) return { label: 'Outstanding', icon: <Star size={28} style={{ color: '#22c55e' }} />, gradient: 'linear-gradient(135deg, #22c55e, #16a34a)', badgeClass: 'badge-success' };
    if (score >= 80) return { label: 'Meets Expectations', icon: <CheckCircle2 size={28} style={{ color: '#818cf8' }} />, gradient: 'linear-gradient(135deg, #6366f1, #818cf8)', badgeClass: 'badge-info' };
    if (score >= 50) return { label: 'Meets Minimal', icon: <BarChart3 size={28} style={{ color: '#eab308' }} />, gradient: 'linear-gradient(135deg, #eab308, #ca8a04)', badgeClass: 'badge-warning' };
    if (score >= 41) return { label: 'Needs Improvement', icon: <AlertTriangle size={28} style={{ color: '#f97316' }} />, gradient: 'linear-gradient(135deg, #f97316, #ea580c)', badgeClass: 'badge-warning' };
    return { label: 'Unsatisfactory', icon: <XCircle size={28} style={{ color: '#ef4444' }} />, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', badgeClass: 'badge-danger' };
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
            <Trophy size={24} />
          </div>
          <h2 className="text-2xl font-bold gradient-text m-0">My Final Scores</h2>
        </div>
        <hr className="section-divider" style={{ margin: '0 0 1.5rem 0' }} />
        
        <div className="space-y-5">
          {results.map(res => {
            const rating = getRatingInfo(res.finalScore);
            return (
              <div key={res.id} className="eval-item">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                      {rating.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1" style={{ color: '#e2e8f0' }}>{res.cycleId}</h3>
                      <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                        Completed on: {new Date(res.completedAt || res.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {/* Score Display */}
                    <div className="text-right">
                      <div className="text-4xl font-bold" style={{
                        background: rating.gradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                        {res.finalScore.toFixed(2)}%
                      </div>
                    </div>
                    
                    {/* Rating Badge */}
                    <span className={`badge ${rating.badgeClass}`}>
                      {rating.label}
                    </span>

                    {/* Score Bar */}
                    <div className="w-40 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
                      <div 
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(res.finalScore, 100)}%`,
                          background: rating.gradient,
                          transition: 'width 1s ease-out'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {results.length === 0 && (
            <div className="text-center py-16" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
              <div className="flex justify-center mb-4">
                <BarChart3 size={48} opacity={0.5} />
              </div>
              <p className="font-semibold text-lg mb-1">No finalized evaluations yet</p>
              <p className="text-sm">Your evaluation results will appear here once they are finalized by the administrator.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
