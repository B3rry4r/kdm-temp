import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from '../../Registration/Modal';
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AlertMessage from "../../../components/AlertMessage";

// Match QuizResultsPage types
interface Option {
  id: number;
  text: string;
}
interface Question {
  id: string;
  text: string;
  options: Option[];
  correctAnswerOptionId: number | null;
}

const FinancialLiteracyQuizResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load questions from localStorage
        const questionsRaw = localStorage.getItem('quiz-final-questions-financial-literacy');
        if (!questionsRaw) {
          setError('No quiz questions found in localStorage.');
          setLoading(false);
          return;
        }
        let formattedQuestions: Question[] = [];
        try {
          formattedQuestions = JSON.parse(questionsRaw);
        } catch (jsonErr) {
          setError('Failed to parse questions from localStorage: ' + (jsonErr as Error).message);
          setLoading(false);
          return;
        }
        setQuestions(formattedQuestions);
        // Retrieve the final answers map { questionId: selectedOptionId } directly from localStorage
        const finalAnswersRaw = localStorage.getItem('quiz-final-answers-financial-literacy');
        let finalAnswers: Record<string, number | null> = {};
        if (finalAnswersRaw) {
          try {
            finalAnswers = JSON.parse(finalAnswersRaw);
          } catch (e) {
            setError('Could not load your previously selected answers.');
          }
        }
        setAnswers(finalAnswers);
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load results: ' + (err?.message || err));
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  // --- Derived score logic ---
  const totalQuestions = questions.length;
  const correctCount = questions.reduce((acc, q) => {
    const selected = answers[q.id];
    return acc + (selected === q.correctAnswerOptionId ? 1 : 0);
  }, 0);
  const incorrectCount = totalQuestions - correctCount;
  const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passmark = 70; // Hardcoded or configurable
  const passed = finalScore >= passmark;

  // --- Participant Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [participantType, setParticipantType] = useState<'institution' | 'individual'>('institution');
  const { apiClient } = useAuth();
  const [institutionCode, setInstitutionCode] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setParticipantType('institution');
    setInstitutionCode('');
    setModalError(null);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleDownload = async () => {
    setModalLoading(true);
    setModalError(null);

    if (participantType === 'individual') {
      try {
        const response = await apiClient.post('/quiz/access/pay', {
          amount: 500,
          type: 2, // 2 for Quiz Payment
          redirect_url: `${window.location.origin}/super-quiz/certificate/download`
        });
        window.location.href = response.data.payment_url;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Could not initiate payment. Please try again.';
        setModalError(errorMsg);
        setModalLoading(false);
      }
      return;
    }

    if (participantType === 'institution') {
      if (!institutionCode.trim()) {
        setModalError('Please enter an institution code.');
        setModalLoading(false);
        return;
      }
      try {
        const response = await apiClient.post('/quiz/access', {
          type: 1, // 1 for Financial Literacy Quiz
          code: institutionCode,
          status: 1,
          amount: 0,
        });
        localStorage.setItem('certificate_url', response.data.certificate_url);
        localStorage.setItem('quiz_type', 'financial-literacy');
        navigate('/super-quiz/certificate/download');
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Invalid institution code. Please check and try again.';
        setModalError(errorMsg);
      } finally {
        setModalLoading(false);
      }
    }
  };

  // --- Handler function ---
  const handleGoToQuiz = () => {
    window.location.href = '/quiz/financial-literacy';
  };

  // --- Loading and Error states ---
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-red-500 text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto py-15 bg-[#FFFEF6]">
      {/* Header */}
      <div className="flex items-center gap-6 px-4 md:px-10 lg:px-60 pt-6 pb-2">
        <span className="text-xl cursor-pointer" onClick={handleGoToQuiz}>×</span>
        <span className="font-semibold text-lg text-gray-700">Basic Financial Literacy Quiz</span>
      </div>
      {/* Banner */}
      <div className={`w-full py-10 px-4 md:px-10 lg:px-60 ${passed ? 'bg-[#D9FAD7]' : 'bg-[#FFD6D6]'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className={`text-2xl font-bold text-center md:text-left ${passed ? 'text-[#0A3A10]' : 'text-[#9B1C1C]'}`}>{passed ? 'Congratulations!! You passed' : 'Sorry, you did not pass'}</h1>
          <button
            className="bg-white rounded px-5 py-2 text-[#222] font-medium border border-gray-200 shadow-sm"
            onClick={handleGoToQuiz}
          >
            Go to Quiz
          </button>
        </div>
      </div>
      {/* Score Summary */}
      <div className="flex flex-wrap gap-8 px-4 md:px-10 lg:px-60 py-8">
        <div className="bg-[#FFF6E5] rounded-xl shadow p-6 flex flex-wrap gap-8 items-center">
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500">To Pass</span>
            <span className="text-2xl font-bold text-[#222]">{passmark}%</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500">Your Grade</span>
            <span className="text-2xl font-bold text-[#0A9B1C]">{finalScore}%</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500">Correct</span>
            <span className="text-2xl font-bold text-[#222]">{correctCount}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500">Incorrect</span>
            <span className="text-2xl font-bold text-[#222]">{incorrectCount}</span>
          </div>
        </div>
      </div>
      {/* Certificate Section */}
      {passed && (
        <div className="flex flex-col md:flex-row items-center gap-8 px-4 md:px-10 lg:px-60 pb-8">
          <img src="/certificate_sample.png" alt="Certificate" className="w-40 h-28 rounded shadow border border-gray-200 object-cover bg-white" />
          <div className="flex flex-col gap-2 text-center md:text-left">
            <span className="font-semibold text-lg">Congratulations on getting your certificate!</span>
            <button
              className="bg-[#FFD600] hover:bg-[#FFB800] text-[#222] font-bold px-6 py-2 mt-2 rounded-lg shadow"
              onClick={handleOpenModal}
            >
              Download Certificate
            </button>
          </div>
        </div>
      )}
      {/* Participant Type Modal for certificate download */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} width="w-full max-w-md">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Select participant type</h2>
          
          {modalError && <AlertMessage message={modalError} open={true} onClose={() => setModalError(null)} />}

          <div className="flex flex-col md:flex-row gap-4">
            <button
              className={`flex-1 border rounded-lg py-4 px-2 flex flex-col items-center ${participantType === 'institution' ? 'border-[#68049B] bg-[#F8F4FF]' : 'border-gray-200 bg-white'}`}
              onClick={() => setParticipantType('institution')}
            >
              <span className="font-bold">Institution member</span>
              <span className="text-xs text-gray-500 mt-1">Institution members download with code</span>
            </button>
            <button
              className={`flex-1 border rounded-lg py-4 px-2 flex flex-col items-center ${participantType === 'individual' ? 'border-[#68049B] bg-[#F8F4FF]' : 'border-gray-200 bg-white'}`}
              onClick={() => setParticipantType('individual')}
            >
              <span className="font-bold">Individual</span>
              <span className="text-xs text-gray-500 mt-1">Pay if you want to download as individual</span>
            </button>
          </div>
          {participantType === 'institution' && (
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-medium">Institution code</label>
              <input
                type="text"
                placeholder="Enter institution code"
                className="border border-gray-300 rounded px-3 py-2 text-sm"
                value={institutionCode}
                onChange={e => setInstitutionCode(e.target.value)}
              />
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button
              className="flex-1 py-2 rounded bg-gray-200 text-gray-800 font-medium"
              onClick={handleCloseModal}
            >Go back</button>
            <button
              className="flex-1 py-2 rounded bg-[#FFD600] text-black font-bold disabled:opacity-50 flex items-center justify-center"
              onClick={handleDownload}
              disabled={(participantType === 'institution' && institutionCode.trim() === '') || modalLoading}
            >
              {modalLoading ? <div className="loader-small"></div> : 'Download'}
            </button>
          </div>
        </div>
      </Modal>
      {/* Answers Section */}
      <div className="px-4 md:px-10 lg:px-60 lg:pr-70 pb-10">
        <h2 className="text-lg font-bold mt-2 mb-4">Your answers</h2>
        {questions.map((q, idx) => {
          const selectedOptionId = answers[q.id];
          const correctAnswerOptionId = q.correctAnswerOptionId;
          return (
            <div key={q.id} className="mb-6">
              <div className="font-semibold mb-2">{idx + 1}. {q.text}</div>
              <div className="flex flex-col gap-1">
                {q.options.map((opt) => {
                  const isSelected = opt.id === selectedOptionId;
                  const isCorrect = opt.id === correctAnswerOptionId;
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-2 text-sm py-1 px-2 rounded transition-all ${isSelected && isCorrect
                          ? 'bg-[#E8F9E4]'
                          : isSelected && !isCorrect
                            ? 'bg-[#FFE6E6]'
                            : isCorrect
                              ? 'bg-[#F6FDEB]'
                              : ''
                        }`}
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        disabled
                        checked={isSelected}
                        className="form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span>{opt.text}</span>
                      {isSelected && !isCorrect && (
                        <span className="ml-2 text-[#E53E3E] font-medium text-xs">Incorrect answer</span>
                      )}
                      {isCorrect && (
                        <span className="ml-2 text-[#0A9B1C] font-medium text-xs">Correct answer</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- End of component ---
export default FinancialLiteracyQuizResultsPage;
