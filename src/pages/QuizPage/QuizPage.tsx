import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QuizCloseSVG } from "../../assets/icons/icons";
import { useAuth } from "../../context/AuthContext/AuthContext";
import AlertMessage from '../../components/AlertMessage';
import { useCourseProgress } from "../../context/CourseProgressContext/CourseProgressContext";

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
  <div className="py-6 max-lg:px-4">
    <div className="flex flex-col gap-4">
      <div className="font-bold">
        {index + 1}. {question.text}
      </div>
      <div className="flex flex-col gap-3">
        {question.options.map((opt, idx) => (
          <label key={idx} className="flex items-center gap-3 text-sm">
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
  const { markSectionComplete } = useCourseProgress();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, []);

  // Submit quiz function (extracted to be reusable)
  const submitQuiz = useCallback(async (isTimeout: boolean = false) => {
    if (!courseId || !quizSettings) return;

    try {
      let correctCount = 0;
      let incorrectCount = 0;

      questions.forEach((q) => {
        const userAnswer = answers[q.id];
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
      try {
        await apiClient.post('/course/quiz/submit', {
          course_id: parseInt(courseId),
          score,
          correct: correctCount,
          incorrect: incorrectCount,
        });

        // If the user passes, mark the quiz as completed
        if (score >= quizSettings.passmark) {
          try {
            // Call the API endpoint to mark the section as complete
            await apiClient.post(`/course/section/complete/${courseId}`, {
              section_id: parseInt(courseId)
            });
            
            // Update progress in context (localStorage)
            if (courseId) {
              markSectionComplete(parseInt(courseId), parseInt(courseId));
            }
          } catch (sectionErr: any) {
            console.error('Error marking section complete:', sectionErr.response?.data || sectionErr.message);
            // Continue with quiz submission even if section marking fails
          }
        }

        // Store answers in localStorage to pass to QuizResultsPage
        localStorage.setItem(`quiz-answers-${courseId}`, JSON.stringify(answers));
        
        // Show timeout message if quiz timed out
        if (isTimeout) {
          setAlertMsg('Time is up! Your quiz has been submitted.');
          setAlertSeverity('error');
          setAlertOpen(true);
          
          // Give user a moment to see the message before redirecting
          setTimeout(() => {
            navigate(`/quiz-results/${courseId}`);
          }, 2000);
        } else {
          navigate(`/quiz-results/${courseId}`);
        }
      } catch (submitErr: any) {
        console.error('Error submitting quiz:', submitErr.response?.data || submitErr.message);
        setAlertMsg(submitErr.response?.data?.message || 'Failed to submit quiz. Please try again.');
        setAlertSeverity('error');
        setAlertOpen(true);
      }
    } catch (err: any) {
      console.error('Error processing quiz answers:', err.message);
      setAlertMsg('Error processing quiz answers. Please try again.');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  }, [courseId, quizSettings, questions, answers, apiClient, navigate, markSectionComplete]);

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
        console.log(settingsResponse.data);
        setQuizSettings(settingsResponse.data);

        // Fetch quiz questions
        const questionsResponse = await apiClient.get<QuizQuestion[]>(`/course/quiz/questions/${courseId}`);
        console.log(questionsResponse.data);
        
        // Process the questions data correctly based on the actual API response format
        const formattedQuestions = questionsResponse.data
          .filter(q => q.options.length > 0 && q.correct_answer !== null)
          .map((q) => {
            // Find the correct option based on answer_id in correct_answer
            const correctAnswerId = q.correct_answer?.answer_id;
            
            return {
              id: q.id.toString(),
              text: q.question,
              options: q.options.map((opt) => opt.answer),
              correctAnswerId: correctAnswerId || 0
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
    if (quizSettings && !loading && !timeRemaining) {
      setTimeRemaining(quizSettings.duration);
      setTimerActive(true);
    }
  }, [quizSettings, loading, timeRemaining]);

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive || timeRemaining === null) return;

    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timerInterval);
          submitQuiz(true); // Auto-submit when timer hits zero
          return 0;
        }
        return prev - 1000; // Decrease by 1 second (1000ms)
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [timerActive, timeRemaining, submitQuiz]);

  const handleSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = () => {
    submitQuiz(false); // Regular submission (not timeout)
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