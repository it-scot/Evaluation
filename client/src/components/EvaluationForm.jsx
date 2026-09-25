import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2, AlertCircle, Check } from 'lucide-react';

export default function EvaluationForm({ assignment, onBack }) {
  const [template, setTemplate] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'templates', assignment.templateId));
        if (docSnap.exists()) {
          setTemplate(docSnap.data());
          // Initialize answers map
          const initialAnswers = {};
          docSnap.data().questions.forEach((q, i) => {
            initialAnswers[i] = 3; // Default to 'Meets Minimal Expectations' roughly
          });
          setAnswers(initialAnswers);
        }
      } catch (error) {
        console.error("Error fetching template:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [assignment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Calculate total score based on 1-5 scale per question
      const totalQuestions = Object.keys(answers).length;
      let totalScore = 0;
      for (const val of Object.values(answers)) {
        totalScore += parseInt(val, 10);
      }
      const maxPossibleScore = totalQuestions * 5;
      const percentageScore = (totalScore / maxPossibleScore) * 100;

      // Save response
      await addDoc(collection(db, 'responses'), {
        assignmentId: assignment.id,
        cycleId: assignment.cycleId,
        evaluatorId: assignment.evaluatorId,
        targetUserId: assignment.targetUserId,
        answers,
        percentageScore,
        submittedAt: new Date().toISOString()
      });

      // Update assignment status
      await updateDoc(doc(db, 'assignments', assignment.id), {
        status: 'Completed'
      });
      
      onBack(); // Go back to inbox
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitting(false);
    }
  };

  const ratingLabels = {
    1: 'Unsatisfactory',
    2: 'Needs Improvement',
    3: 'Meets Minimal',
    4: 'Meets Expectations',
    5: 'Outstanding'
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center loading-text">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#a78bfa', borderTopColor: 'transparent' }}></div>
        <p className="font-semibold" style={{ color: '#a78bfa' }}>Loading form...</p>
      </div>
    </div>
  );

  if (!template) return (
      <div className="glass-card text-center max-w-md mx-auto">
      <div className="flex justify-center mb-4">
        <AlertCircle size={40} style={{ color: '#fca5a5' }} />
      </div>
      <p className="font-semibold" style={{ color: '#fca5a5' }}>Error loading form template.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div className="glass-card">
        {/* Back Button */}
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-sm font-semibold mb-8 cursor-pointer"
          style={{ 
            color: '#a78bfa', 
            background: 'none', 
            border: 'none',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.color = '#c4b5fd'}
          onMouseLeave={(e) => e.target.style.color = '#a78bfa'}
        >
          <ArrowLeft size={16} /> Back to Inbox
        </button>
        
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold gradient-text mb-2">
            {assignment.type}
          </h2>
          <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            Evaluating: <span className="font-semibold" style={{ color: '#a78bfa' }}>{assignment.targetName}</span>
          </p>
        </div>

        <hr className="section-divider" />

        <p className="text-sm mb-8" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Please answer all questions thoughtfully. Rate each criterion on a scale of <span style={{ color: '#a78bfa' }}>1 (Unsatisfactory)</span> to <span style={{ color: '#a78bfa' }}>5 (Outstanding)</span>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {template.questions.map((q, i) => (
            <div key={i} className="question-card">
              <p className="text-base font-semibold mb-5" style={{ color: '#e2e8f0' }}>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg mr-3 text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))', color: '#c4b5fd' }}>
                  {i + 1}
                </span>
                {q}
              </p>
              
              <div className="flex gap-2 sm:gap-4 justify-center flex-wrap">
                {[1, 2, 3, 4, 5].map(rating => (
                  <label 
                    key={rating} 
                    className="rating-option"
                    style={{
                      background: answers[i] === rating 
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))' 
                        : 'transparent',
                      border: answers[i] === rating 
                        ? '1px solid rgba(139, 92, 246, 0.4)' 
                        : '1px solid transparent'
                    }}
                  >
                    <input 
                      type="radio" 
                      name={`q-${i}`} 
                      value={rating}
                      checked={answers[i] === rating}
                      onChange={() => setAnswers({...answers, [i]: rating})}
                      className="w-5 h-5"
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span className={`rating-number ${answers[i] === rating ? 'selected' : ''}`}>
                      {rating}
                    </span>
                    <span className="text-xs hidden sm:block" style={{ 
                      color: answers[i] === rating ? '#c4b5fd' : 'rgba(255, 255, 255, 0.25)',
                      maxWidth: '70px',
                      textAlign: 'center',
                      lineHeight: '1.2'
                    }}>
                      {ratingLabels[rating]}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between text-xs mt-3 sm:hidden" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                <span>1 - Unsatisfactory</span>
                <span>5 - Outstanding</span>
              </div>
            </div>
          ))}
          
          <hr className="section-divider" />

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={submitting} className="btn-primary px-10 py-3.5 text-base flex items-center gap-2">
              {submitting ? (
                <><Loader2 size={18} className="animate-spin" /> Submitting...</>
              ) : (
                <><Check size={18} /> Submit Evaluation</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
