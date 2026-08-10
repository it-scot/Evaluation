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
      // Adjust URL as needed if deploying
      const res = await fetch('http://localhost:5000/api/evaluate/bulk-initiate', {
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
    <div className="card max-w-4xl mx-auto">
      <h2 className="mb-6">Department Bulk Initiation</h2>
      
      <div className="mb-8 p-4 bg-gray-50 border-l-4 border-black text-sm">
        <p className="font-semibold mb-2">Instructions:</p>
        <p>Upload a CSV file containing the employees for a specific department. The system will automatically detect the Head of Department and randomly assign Up-level and Same/Sub-level peer evaluators for every employee, using the specific templates you select below.</p>
        <p className="mt-2 font-mono text-xs bg-gray-200 p-2 inline-block">
          Required Columns: name, email, department, designation, hierarchy_level
        </p>
        <p className="mt-1 text-xs text-gray-600">Note: hierarchy_level must be a number (e.g., 3 for Manager, 2 for Senior, 1 for Junior).</p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-gray-100 border border-black font-medium text-center">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-gray-200 p-6 bg-gray-50">
          
          <h3 className="mb-4 text-lg border-b pb-2">Select Perspective Templates</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Self-Evaluation Template</label>
              <select value={selfTemplateId} onChange={(e) => setSelfTemplateId(e.target.value)} required className="w-full">
                <option value="">Select Template...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Primary Evaluator (HoD) Template</label>
              <select value={primaryTemplateId} onChange={(e) => setPrimaryTemplateId(e.target.value)} required className="w-full">
                <option value="">Select Template...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Up-Level Peer Template</label>
              <select value={upLevelTemplateId} onChange={(e) => setUpLevelTemplateId(e.target.value)} required className="w-full">
                <option value="">Select Template...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Same/Sub-Level Peer Template</label>
              <select value={sameLevelTemplateId} onChange={(e) => setSameLevelTemplateId(e.target.value)} required className="w-full">
                <option value="">Select Template...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 border-t pt-4">Department CSV File</label>
            <input 
              id="csv-upload"
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
              required
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:border file:border-black
                file:text-sm file:font-semibold
                file:bg-black file:text-white
                hover:file:bg-gray-800 transition-colors cursor-pointer mt-2"
            />
          </div>

        </div>

        <div className="flex justify-end mt-8">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Processing...' : 'Auto-Assign & Initiate'}
          </button>
        </div>
      </form>
    </div>
  );
}
