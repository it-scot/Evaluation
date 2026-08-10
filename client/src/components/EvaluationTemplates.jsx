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
    <div className="card">
      <h2 className="mb-6">Evaluation Templates</h2>
      
      <div className="mb-8 bg-gray-50 p-6 border border-gray-200">
        <h3 className="mb-4 text-lg">Create New Template</h3>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Template Title (e.g., "Academic HoD Evaluation 2026")</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Questions (1-5 Rating Scale will be used)</label>
            {questions.map((q, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  value={q} 
                  onChange={(e) => handleQuestionChange(index, e.target.value)}
                  placeholder={`Question ${index + 1}`}
                  required 
                />
                {questions.length > 1 && (
                  <button type="button" onClick={() => handleRemoveQuestion(index)} className="btn-secondary px-3 text-red-600 border-red-200 hover:border-red-600">
                    X
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddQuestion} className="text-sm font-medium text-gray-600 hover:text-black underline mt-2">
              + Add another question
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Publishing...' : 'Publish Template'}
          </button>
        </form>
      </div>

      <div>
        <h3 className="mb-4 text-lg">Published Templates</h3>
        <div className="space-y-4">
          {templates.map((t) => (
            <div key={t.id} className="border border-gray-200 p-4 bg-white shadow-sm flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg mb-2">{t.title}</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {t.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
              <button onClick={() => handleDelete(t.id)} className="text-xs text-red-500 hover:underline">
                Delete
              </button>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="p-6 border border-gray-200 text-center text-gray-500 bg-gray-50">
              No templates created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
