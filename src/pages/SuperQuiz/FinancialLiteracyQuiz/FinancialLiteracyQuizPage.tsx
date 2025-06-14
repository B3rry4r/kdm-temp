import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AlertMessage from '../../../components/AlertMessage';

interface QuizQuestionOption {
  id: number;
  question_id: number;
  answer: string;
}

interface QuizQuestionCorrectAnswer {
  id: number;
  question_id: number;
  answer_id: number;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: QuizQuestionOption[];
  correct_answer: QuizQuestionCorrectAnswer | null;
}

interface Option {
  id: number;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
  correctAnswerOptionId: number;
}

interface QuestionComponentProps {
  question: Question;
  index: number;
  selectedOptionId: number | null;
  onSelect: (questionId: string, optionId: number) => void;
}

const QuestionComponent: React.FC<QuestionComponentProps> = ({
  question,
  index,
  selectedOptionId,
  onSelect,
}) => (
  <div className="py-6 max-lg:px-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <div className="font-bold">
        {index + 1}. {question.text}
      </div>
      <div className="flex flex-col gap-3">
        {question.options.map((opt, optIdx) => (
          <label key={optIdx} className="flex items-center gap-3 text-sm">
            <input
              type="radio"
              name={`question_${question.id}`}
              value={opt.id}
              checked={selectedOptionId === opt.id}
              onChange={() => onSelect(question.id, opt.id)}
              className="form-radio h-4 w-4"
            />
            {opt.text}
          </label>
        ))}
      </div>
    </div>
  </div>
);

const FinancialLiteracyQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { apiClient } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  const [timeRemaining, setTimeRemaining] = useState<number>(45 * 60); // 45 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);

  const formatTime = useCallback((totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, []);

  const submitQuiz = useCallback(async (isTimeout: boolean = false) => {
    let correctCount = 0;
    let incorrectCount = 0;

    questions.forEach((q) => {
      const selectedOptionId = answers[q.id];
      const correctAnswerOptionId = q.correctAnswerOptionId;
      if (selectedOptionId !== null && selectedOptionId === correctAnswerOptionId) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });
    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    try {
      await apiClient.post("/quiz/store/scores", {
        score,
        correct: correctCount,
        incorrect: incorrectCount,
        timeout: isTimeout,
        quiz_type: "financial-literacy"
      });
      // Save user's answers and questions to localStorage
      localStorage.setItem('quiz-final-answers-financial-literacy', JSON.stringify(answers));
      localStorage.setItem('quiz-final-questions-financial-literacy', JSON.stringify(questions));
      navigate("/super-quiz/financial-literacy/results");
    } catch (error: any) {
      setAlertMsg(error.response?.data?.message || 'Failed to submit quiz.');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  }, [questions, answers, apiClient, navigate]);

  useEffect(() => {
    const fetchQuizData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Expecting API to return array of { id, question, options (array), correctAnswer }
        const questionsResponse = await apiClient.get("/quiz/get/fl");
        const fetchedQuestions: QuizQuestion[] = questionsResponse.data;
        // Parse according to provided quiz JSON
        const formattedQuestions: Question[] = fetchedQuestions.map((q: any) => {
          const options: Option[] = q.options.map((opt: string | { id: number; answer: string }) => {
            if (typeof opt === 'string') {
              return { id: Math.random(), text: opt };
            } else {
              return { id: opt.id, text: opt.answer };
            }
          });
          // Find correct answer index or id
          let correctAnswerOptionId = 0;
          if (q.correctAnswer) {
            // Find by text
            const idx = options.findIndex(opt => opt.text.trim() === q.correctAnswer.trim());
            if (idx !== -1) correctAnswerOptionId = options[idx].id;
          } else if (q.correct_answer && q.correct_answer.answer_id) {
            correctAnswerOptionId = q.correct_answer.answer_id;
          }
          return {
            id: q.id.toString(),
            text: q.question,
            options,
            correctAnswerOptionId,
          };
        });
        setQuestions(formattedQuestions);
        setAnswers(
          formattedQuestions.reduce((acc, q) => {
            acc[q.id] = null;
            return acc;
          }, {} as Record<string, number | null>)
        );
        setLoading(false);
        setTimerActive(true);
      } catch (err: any) {
        setError('Failed to load quiz questions.');
        setLoading(false);
      }
    };
    fetchQuizData();
  }, [apiClient]);

  useEffect(() => {
    if (!timerActive) return;
    if (timeRemaining <= 0) {
      setTimerActive(false);
      submitQuiz(true);
      return;
    }
    const timer = setTimeout(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timerActive, timeRemaining, submitQuiz]);

  const handleSelect = (questionId: string, optionId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuiz(false);
  };

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
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="font-bold text-lg">Financial Literacy Quiz</div>
        <div className="text-sm">Time Remaining: {formatTime(timeRemaining)}</div>
      </div>
      {questions.map((q, idx) => (
          <QuestionComponent
            key={idx}
            question={q}
            index={idx}
            selectedOptionId={answers[q.id]}
            onSelect={handleSelect}
          />
      ))}
      <button
        type="submit"
        className="mt-6 w-full bg-[#FFD30F] text-black font-semibold py-3 rounded-md hover:brightness-95"
      >
        Submit Quiz
      </button>
      <AlertMessage open={alertOpen} message={alertMsg} severity={alertSeverity} onClose={() => setAlertOpen(false)} />
    </form>
  );
};

export default FinancialLiteracyQuizPage;
