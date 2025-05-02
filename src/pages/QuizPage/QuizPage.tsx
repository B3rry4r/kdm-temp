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
  duration: number;
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
  
  // Add timer state
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  // Convert time remaining to minutes and seconds
  const formatTime = useCallback((milliseconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, []);

  // Submit quiz function (extracted to be reusable)
  const submitQuiz = useCallback(async (isTimeout: boolean = false) => {
    if (!courseId) return;
    console.log("Submitting quiz...");
    console.log("Current answers state (questionId: selectedOptionId):", answers);

    // Calculate score based on current state
    let correctCount = 0;
    let incorrectCount = 0;

    questions.forEach((q) => {
      const selectedOptionId = answers[q.id]; // Already holds the option ID or null
      const correctAnswerOptionId = q.correctAnswerOptionId; // Get correct answer ID from question data

      if (selectedOptionId !== null && selectedOptionId === correctAnswerOptionId) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    console.log(`Calculated Score: ${score}%, Correct: ${correctCount}, Incorrect: ${incorrectCount}`);

    try {
      // Submit the calculated score to the backend
      await apiClient.post(`/course/quiz/submit`, {
        course_id: parseInt(courseId),
        score: score,
        correct: correctCount,
        incorrect: incorrectCount,
        timeout: isTimeout, // Send timeout status
      });
      console.log("Quiz results submitted successfully via API.");

      // Store the final answers state in localStorage
      const finalAnswersToStore = answers; // The state already holds { questionId: selectedOptionId }
      try {
        localStorage.setItem(`quiz-final-answers-${courseId}`, JSON.stringify(finalAnswersToStore));
        console.log(`Stored final answers in localStorage (quiz-final-answers-${courseId}):`, finalAnswersToStore);
      } catch (error) {
        console.error("Error storing final answers in localStorage:", error);
      }

      // Navigate to results page WITHOUT passing state
      navigate(`/quiz-results/${courseId}`);

    } catch (error: any) {
      console.error("Error submitting quiz results:", error.response?.data || error.message);
      setAlertMsg(error.response?.data?.message || 'Failed to submit quiz. Please try again.');
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
        console.log("Raw duration from API:", fetchedSettings.duration);

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
        console.error('Error fetching quiz data:', err.response?.data || err.message);
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [courseId, apiClient]);

  // Set up the timer when quiz settings are loaded
  useEffect(() => {
    if (quizSettings && !loading && timeRemaining === null && quizSettings.duration > 0) {
      setTimeRemaining(quizSettings.duration); 
      setTimerActive(true);
    } else if (quizSettings && quizSettings.duration <= 0) {
      console.warn("Received non-positive duration from API:", quizSettings.duration);
      setTimeRemaining(0); 
      setTimerActive(false);
    }
  }, [quizSettings, loading]);

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive || timeRemaining === null || timeRemaining <= 0) {
      if (timeRemaining !== null && timeRemaining <= 0) {
        setTimerActive(false); 
      }
      return; 
    }

    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1000) { 
          clearInterval(timerInterval);
          setTimerActive(false); 
          setTimeout(() => submitQuiz(true), 50); 
          return 0;
        }
        return prev - 1000; 
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [timerActive, timeRemaining, submitQuiz]);

  const handleSelect = (questionId: string, optionId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = () => {
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

  const durationInMinutes = Math.floor(quizSettings.duration / 60000);

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