import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';

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

  if (loading) return <div className="p-8">Loading form...</div>;
  if (!template) return <div className="p-8">Error loading form template.</div>;

  return (
    <div className="card max-w-4xl mx-auto">
      <button onClick={onBack} className="text-sm font-semibold underline mb-6">
        &larr; Back to Inbox
      </button>
      
      <h2 className="mb-2 text-2xl font-serif border-b pb-4">
        {assignment.type} for {assignment.targetName}
      </h2>
      <p className="text-gray-600 mb-8 font-medium">Please answer all questions thoughtfully.</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {template.questions.map((q, i) => (
          <div key={i} className="bg-gray-50 p-6 border border-gray-200">
            <p className="text-lg font-medium mb-4">{i + 1}. {q}</p>
            
            <div className="flex gap-4 sm:gap-8 justify-center">
              {[1, 2, 3, 4, 5].map(rating => (
                <label key={rating} className="flex flex-col items-center gap-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name={`q-${i}`} 
                    value={rating}
                    checked={answers[i] === rating}
                    onChange={() => setAnswers({...answers, [i]: rating})}
                    className="w-5 h-5 accent-black cursor-pointer"
                  />
                  <span className={`text-sm font-semibold ${answers[i] === rating ? 'text-black' : 'text-gray-400 group-hover:text-black'}`}>
                    {rating}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>1 - Unsatisfactory</span>
              <span>5 - Outstanding</span>
            </div>
          </div>
        ))}
        
        <div className="border-t pt-6 flex justify-end">
          <button type="submit" disabled={submitting} className="btn-primary px-12 py-3 text-lg">
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </div>
      </form>
    </div>
  );
}
