import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

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

  if (loading) return <div>Loading results...</div>;

  const getRatingString = (score) => {
    if (score >= 90) return { label: 'Outstanding', color: 'bg-green-100 text-green-800 border-green-200' };
    if (score >= 80) return { label: 'Meets Expectations', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (score >= 50) return { label: 'Meets Minimal Expectations', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    if (score >= 41) return { label: 'Needs Improvement', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    return { label: 'Unsatisfactory', color: 'bg-red-100 text-red-800 border-red-200' };
  };

  return (
    <div className="card">
      <h2 className="mb-6 border-b pb-4">My Final Scores</h2>
      
      <div className="space-y-6">
        {results.map(res => {
          const rating = getRatingString(res.finalScore);
          return (
            <div key={res.id} className="border border-gray-200 p-6 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-xl mb-1">{res.cycleId}</h3>
                <p className="text-sm text-gray-500">Completed on: {new Date(res.completedAt || res.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-4xl font-serif font-bold text-black">{res.finalScore.toFixed(2)}%</div>
                <span className={`px-4 py-1 border text-sm font-bold uppercase tracking-wider ${rating.color}`}>
                  {rating.label}
                </span>
              </div>
            </div>
          );
        })}
        
        {results.length === 0 && (
          <div className="text-center p-8 bg-gray-50 border border-gray-200 text-gray-500">
            No finalized evaluations available yet.
          </div>
        )}
      </div>
    </div>
  );
}
