import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';

export default function EvaluationTemplates() {
  const [templates, setTemplates] = useState([]);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState(['']);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'templates'));
      const tData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTemplates(tData);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddQuestion = () => {
    setQuestions([...questions, '']);
  };

  const handleQuestionChange = (index, value) => {
    const newQs = [...questions];
    newQs[index] = value;
    setQuestions(newQs);
  };

  const handleRemoveQuestion = (index) => {
    const newQs = questions.filter((_, i) => i !== index);
    setQuestions(newQs);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title || questions.some(q => !q.trim())) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'templates'), {
        title,
        questions: questions.filter(q => q.trim() !== '')
      });
      setTitle('');
      setQuestions(['']);
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'templates', id));
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template", error);
    }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div className="glass-card mb-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📋</span>
          <h2 className="text-2xl font-bold gradient-text m-0">Evaluation Templates</h2>
        </div>
        
        <div className="glass-section">
          <h3 className="text-lg font-bold mb-4" style={{ color: '#e2e8f0' }}>Create New Template</h3>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#c4b5fd' }}>
                Template Title
              </label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder='e.g., "Academic HoD Evaluation 2026"'
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#c4b5fd' }}>
                Questions <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(1-5 Rating Scale will be used)</span>
              </label>
              <div className="space-y-3">
                {questions.map((q, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <span className="text-xs font-bold shrink-0 w-6 h-6 flex items-center justify-center rounded-lg"
                          style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
                      {index + 1}
                    </span>
                    <input 
                      type="text" 
                      value={q} 
                      onChange={(e) => handleQuestionChange(index, e.target.value)}
                      placeholder={`Enter question ${index + 1}`}
                      required 
                      className="flex-1"
                    />
                    {questions.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveQuestion(index)} 
                        className="w-9 h-9 flex items-center justify-center rounded-lg shrink-0 text-sm cursor-pointer"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                          e.target.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                          e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={handleAddQuestion} 
                className="mt-4 text-sm font-semibold flex items-center gap-2 cursor-pointer"
                style={{
                  color: '#a78bfa',
                  background: 'none',
                  border: 'none',
                  padding: '4px 0',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#c4b5fd'}
                onMouseLeave={(e) => e.target.style.color = '#a78bfa'}
              >
                <span style={{ fontSize: '1.1em' }}>+</span> Add another question
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '⏳ Publishing...' : '🚀 Publish Template'}
            </button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold m-0" style={{ color: '#e2e8f0' }}>Published Templates</h3>
          <span className="badge badge-info">{templates.length} template{templates.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="space-y-4">
          {templates.map((t) => (
            <div key={t.id} className="eval-item flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <h4 className="font-bold text-base mb-3" style={{ color: '#e2e8f0' }}>{t.title}</h4>
                <div className="space-y-2">
                  {t.questions.map((q, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      <span className="shrink-0 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-md mt-0.5"
                            style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
                        {i + 1}
                      </span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => handleDelete(t.id)} 
                className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                }}
              >
                🗑 Delete
              </button>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="text-center py-10" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
              <div className="text-4xl mb-3">📋</div>
              <p className="font-medium">No templates created yet.</p>
              <p className="text-xs mt-1">Create your first template above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
