import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QuizCloseSVG } from "../../assets/icons/icons";
import { useAuth } from "../../context/AuthContext/AuthContext";
import AlertMessage from '../../components/AlertMessage';

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
  correct_answer: QuizQuestionCorrectAnswer | null;
}

interface QuizSettings {
  id: number;
  course_id: number;
  passmark: number;
  duration: number; // Duration in seconds
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
    <div className="flex flex-col gap-4">
      <div className="font-bold">
        {index + 1}. {question.text}
      </div>
      <div className="flex flex-col gap-3">
        {question.options.map((opt) => (
          <label key={opt.id} className="flex items-center gap-3 text-sm">
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

const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { apiClient } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  const formatTime = useCallback((milliseconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, []);

  const submitQuiz = useCallback(async (isTimeout: boolean = false) => {
    if (!courseId) return;
    console.log("Submitting quiz, isTimeout:", isTimeout);
    console.log("Answers:", answers);

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

    console.log(`Score: ${score}%, Correct: ${correctCount}, Incorrect: ${incorrectCount}`);

    try {
      await apiClient.post(`/course/quiz/submit`, {
        course_id: parseInt(courseId),
        score,
        correct: correctCount,
        incorrect: incorrectCount,
        timeout: isTimeout,
      });
      console.log("Quiz submitted successfully");

      if(score < 80 ) {
        
    try {
      await apiClient.post(`/course/complete/${courseId}`);
      setAlertMsg('Congratulations! You have completed the course.');
      setAlertSeverity('success');
      setAlertOpen(true);
      sessionStorage.setItem(`course-completed-${courseId}`, 'true');
      // setTimeout(() => navigate('/my-courses'), 2000);
    } catch (err: any) {
      console.error(`Error marking course ${courseId} complete:`, err.response?.data || err.message);
    }

      }

      try {
        localStorage.setItem(`quiz-final-answers-${courseId}`, JSON.stringify(answers));
        console.log(`Stored answers in localStorage: quiz-final-answers-${courseId}`);
      } catch (error) {
        console.error("Error storing answers in localStorage:", error);
      }

      navigate(`/quiz-results/${courseId}`);
    } catch (error: any) {
      console.error("Error submitting quiz:", error.response?.data || error.message);
      setAlertMsg(error.response?.data?.message || 'Failed to submit quiz.');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  }, [courseId, questions, answers, apiClient, navigate]);

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!apiClient || !courseId) return;
      setLoading(true);
      setError(null);
      try {
        const [questionsResponse, settingsResponse] = await Promise.all([
          apiClient.get(`/course/quiz/questions/${courseId}`),
          apiClient.get(`/course/quiz/settings/${courseId}`),
        ]);

        const fetchedQuestions: QuizQuestion[] = questionsResponse.data;
        const fetchedSettings: QuizSettings = settingsResponse.data;

        console.log("Fetched Quiz Settings:", fetchedSettings);
        console.log("Duration (seconds):", fetchedSettings.duration);

        setQuizSettings(fetchedSettings);

        const formattedQuestions: Question[] = fetchedQuestions.map((q) => {
          const options: Option[] = q.options.map((opt) => ({
            id: opt.id,
            text: opt.answer,
          }));
          const correctAnswerOptionId = q.correct_answer?.answer_id || 0;
          return {
            id: q.id.toString(),
            text: q.question,
            options,
            correctAnswerOptionId,
          };
        });

        setQuestions(formattedQuestions);
      } catch (err: any) {
        console.error('Error fetching quiz:', err.response?.data || err.message);
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [courseId, apiClient]);

  useEffect(() => {
    if (quizSettings && !loading && timeRemaining === null) {
      const durationMs = quizSettings.duration * 1000; // Convert seconds to milliseconds
      console.log("Initializing timer with duration (ms):", durationMs);
      setTimeRemaining(durationMs);
      setTimerActive(true);
    }
  }, [quizSettings, loading, timeRemaining]);

  useEffect(() => {
    if (!timerActive || timeRemaining === null) return;

    if (timeRemaining <= 0) {
      console.log("Timer reached zero, submitting quiz");
      setTimerActive(false);
      submitQuiz(true);
      return;
    }

    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null) {
          console.error("Timer: prev is null");
          return null;
        }
        const next = prev - 1000;
        console.log("Timer tick, timeRemaining (ms):", next);
        if (next <= 0) {
          clearInterval(timerInterval);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      console.log("Clearing timer interval");
      clearInterval(timerInterval);
    };
  }, [timerActive, timeRemaining, submitQuiz]);

  const handleSelect = (questionId: string, optionId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = () => {
    setTimerActive(false);
    submitQuiz(false);
  };

  const handleClose = () => {
    navigate(`/started-course/${courseId}`);
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (error || !quizSettings) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-red-500 text-xs">{error || 'Quiz settings not found'}</p>
      </div>
    );
  }

  const durationInMinutes = Math.floor(quizSettings.duration / 60);

  return (
    <div className="w-full h-full max-lg:px-4 max-lg:py-4 overflow-y-auto py-15 px-70 bg-white">
      <div className="flex items-start gap-4 pb-6">
        <div onClick={handleClose} className="cursor-pointer">
          <QuizCloseSVG size={30} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl max-lg:text-xl font-bold">Course Quiz</h1>
          <div className="text-md max-lg:text-sm font-bold text-gray-600 mt-1">
            {questions.length} Questions • {durationInMinutes} mins
          </div>
          {timeRemaining !== null && (
            <div className="text-sm font-medium mt-2">
              <span className={timeRemaining < 60000 ? 'text-red-500' : 'text-gray-700'}>
                Time remaining: {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </div>
      <hr className="border-gray-300" />
      <div className="flex flex-col w-[60%] max-lg:w-full my-5 gap-3">
        {questions.map((q, idx) => (
          <React.Fragment key={q.id}>
            <QuestionComponent
              question={q}
              index={idx}
              selectedOptionId={answers[q.id] || null}
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
      
      <AlertMessage
        open={alertOpen}
        message={alertMsg}
        severity={alertSeverity}
        onClose={() => setAlertOpen(false)}
      />
    </div>
  );
};

export default QuizPage;