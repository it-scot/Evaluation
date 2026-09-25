import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function BulkInitiation() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  
  // 4 perspective templates
  const [selfTemplateId, setSelfTemplateId] = useState('');
  const [primaryTemplateId, setPrimaryTemplateId] = useState('');
  const [upLevelTemplateId, setUpLevelTemplateId] = useState('');
  const [sameLevelTemplateId, setSameLevelTemplateId] = useState('');
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const snap = await getDocs(collection(db, 'templates'));
        setTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
    };
    fetchTemplates();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selfTemplateId || !primaryTemplateId || !upLevelTemplateId || !sameLevelTemplateId) {
      setMessage("Please select all 4 templates and a CSV file.");
      return;
    }

    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('selfTemplateId', selfTemplateId);
    formData.append('primaryTemplateId', primaryTemplateId);
    formData.append('upLevelTemplateId', upLevelTemplateId);
    formData.append('sameLevelTemplateId', sameLevelTemplateId);

    try {
      const token = await user.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/evaluate/bulk-initiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Success! Initiated evaluations for ${data.totalProcessed} employees.`);
        setFile(null);
        setSelfTemplateId('');
        setPrimaryTemplateId('');
        setUpLevelTemplateId('');
        setSameLevelTemplateId('');
        // Reset file input visually
        document.getElementById('csv-upload').value = '';
      } else {
        setMessage(data.error || "Failed to process bulk initiation.");
      }
    } catch (error) {
      console.error(error);
      setMessage("An error occurred during bulk upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📁</span>
          <h2 className="text-2xl font-bold gradient-text m-0">Department Bulk Initiation</h2>
        </div>
        
        <div className="info-box mb-8">
          <p className="font-bold mb-2" style={{ color: '#e2e8f0' }}>📘 Instructions</p>
          <p>Upload a CSV file containing the employees for a specific department. The system will automatically detect the Head of Department and randomly assign Up-level and Same/Sub-level peer evaluators for every employee, using the specific templates you select below.</p>
          <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(0, 0, 0, 0.2)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
            <span style={{ color: '#a78bfa' }}>Required Columns:</span> name, email, department, designation, hierarchy_level
          </div>
          <p className="mt-2 text-xs" style={{ color: 'rgba(196, 181, 253, 0.6)' }}>
            Note: hierarchy_level must be a number (e.g., 3 for Manager, 2 for Senior, 1 for Junior).
          </p>
        </div>

        {message && (
          <div className="message-box mb-6">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-section">
            
            <h3 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: '#e2e8f0' }}>
              <span>📝</span> Select Perspective Templates
            </h3>
            <hr className="section-divider" style={{ margin: '0 0 1.25rem 0' }} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#c4b5fd' }}>Self-Evaluation Template</label>
                <select value={selfTemplateId} onChange={(e) => setSelfTemplateId(e.target.value)} required>
                  <option value="">Select Template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#c4b5fd' }}>Primary Evaluator (HoD) Template</label>
                <select value={primaryTemplateId} onChange={(e) => setPrimaryTemplateId(e.target.value)} required>
                  <option value="">Select Template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#c4b5fd' }}>Up-Level Peer Template</label>
                <select value={upLevelTemplateId} onChange={(e) => setUpLevelTemplateId(e.target.value)} required>
                  <option value="">Select Template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#c4b5fd' }}>Same/Sub-Level Peer Template</label>
                <select value={sameLevelTemplateId} onChange={(e) => setSameLevelTemplateId(e.target.value)} required>
                  <option value="">Select Template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
            </div>

            <hr className="section-divider" />

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#c4b5fd' }}>📎 Department CSV File</label>
              <input 
                id="csv-upload"
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                required
              />
            </div>

          </div>

          <div className="flex justify-end mt-8">
            <button type="submit" disabled={loading} className="btn-primary px-8">
              {loading ? '⏳ Processing...' : '🚀 Auto-Assign & Initiate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
