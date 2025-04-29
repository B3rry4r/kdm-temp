import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QuizCloseSVG } from "../../assets/icons/icons";
import { useAuth } from "../../context/AuthContext/AuthContext";

// API types
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
  course_id: number;
  question: string;
  options: QuizQuestionOption[];
  correct_answer: QuizQuestionCorrectAnswer;
}

interface QuizSettings {
  id: number;
  course_id: number;
  passmark: number;
  duration: number;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerId: number;
}

interface QuestionComponentProps {
  question: Question;
  index: number;
  selectedOption: string | null;
  onSelect: (questionId: string, option: string) => void;
}

const QuestionComponent: React.FC<QuestionComponentProps> = ({
  question,
  index,
  selectedOption,
  onSelect,
}) => (
  <div className="py-6 max-sm:px-4">
    <div className="flex flex-col gap-4">
      <div className="font-bold">
        {index + 1}. {question.text}
      </div>
      <div className="flex flex-col gap-3">
        {question.options.map((opt) => (
          <label key={opt} className="flex items-center gap-3 text-sm">
            <input
              type="radio"
              name={`question_${question.id}`}
              value={opt}
              checked={selectedOption === opt}
              onChange={() => onSelect(question.id, opt)}
              className="form-radio h-4 w-4"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  </div>
);

const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { apiClient } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!courseId) {
        setError("Course ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch quiz settings
        const settingsResponse = await apiClient.get<QuizSettings>(`/course/quiz/settings/${courseId}`);
        setQuizSettings(settingsResponse.data);

        // Fetch quiz questions
        const questionsResponse = await apiClient.get<QuizQuestion[]>(`/course/quiz/questions/${courseId}`);
        const formattedQuestions = questionsResponse.data.map((q) => ({
          id: q.id.toString(),
          text: q.question,
          options: q.options.map((opt) => opt.answer),
          correctAnswerId: q.correct_answer.answer_id,
        }));
        setQuestions(formattedQuestions);
      } catch (err: any) {
        console.error('Error fetching quiz data:', err.response?.data || err.message);
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [courseId, apiClient]);

  const handleSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (!courseId || !quizSettings) return;

    try {
      let correctCount = 0;
      let incorrectCount = 0;

      questions.forEach((q) => {
        const userAnswer = answers[q.id];
        // const correctOption = q.options.find((_, idx) => q.options[idx] === q.options.find(opt => opt === userAnswer));
        const correctAnswerId = q.correctAnswerId;
        const userAnswerId = q.options.indexOf(userAnswer!) !== -1 ? q.options.indexOf(userAnswer!) + 1 : null;

        if (userAnswerId && correctAnswerId === userAnswerId) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      });

      const total = questions.length;
      const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

      // Submit quiz results
      await apiClient.post('/course/quiz/submit', {
        course_id: parseInt(courseId),
        score,
        correct: correctCount,
        incorrect: incorrectCount,
      });

      // If the user passes, mark the quiz as completed
      if (score >= quizSettings.passmark) {
        await apiClient.post(`/course/section/complete/${courseId}`);
      }

      // Store answers in localStorage to pass to QuizResultsPage
      localStorage.setItem(`quiz-answers-${courseId}`, JSON.stringify(answers));
      navigate(`/quiz-results/${courseId}`);
    } catch (err: any) {
      console.error('Error submitting quiz:', err.response?.data || err.message);
      alert('Failed to submit quiz');
    }
  };

  const handleClose = () => {
    navigate(`/course/${courseId}`);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (error || !quizSettings) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-red-500 text-xs">{error || 'Quiz settings not found'}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full max-sm:px-4 max-sm:py-4 overflow-y-auto py-15 px-70 bg-white">
      <div className="flex items-start gap-4 pb-6">
        <div onClick={handleClose} className="cursor-pointer">
          <QuizCloseSVG size={30} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl max-sm:text-xl font-bold">Course Quiz</h1>
          <div className="text-md max-sm:text-sm font-bold text-gray-600 mt-1">
            {questions.length} Questions • {quizSettings.duration} mins
          </div>
        </div>
      </div>
      <hr className="border-gray-300" />
      <div className="flex flex-col w-[60%] max-sm:w-full my-5 gap-3">
        {questions.map((q, idx) => (
          <React.Fragment key={q.id}>
            <QuestionComponent
              question={q}
              index={idx}
              selectedOption={answers[q.id] || null}
              onSelect={handleSelect}
            />
            <hr className="border-gray-300" />
          </React.Fragment>
        ))}
      </div>

      <div className="flex justify-end pt-8">
        <button
          onClick={handleSubmitQuiz}
          className="bg-[#FFD30F] text-black py-3 px-8 rounded-lg font-bold"
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizPage;