import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QuizCloseSVG } from "../../../assets/icons/icons";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import { useCourseProgress } from "../../../context/CourseProgressContext/CourseProgressContext";
import AlertMessage from "../../../components/AlertMessage";

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

interface QuizScore {
  course_id: number;
  score: number;
  correct: number;
  incorrect: number;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerId: number;
}

const QuizResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { apiClient } = useAuth();
  const { getCourseProgress, markSectionComplete } = useCourseProgress();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [quizScore, setQuizScore] = useState<QuizScore | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'purple' | 'success' | 'error'>('purple');
  
  // Get the course progress percentage
  const courseProgress = courseId ? getCourseProgress(parseInt(courseId)) : 0;

  useEffect(() => {
    const fetchQuizResults = async () => {
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
        
        // Filter out questions with null correct_answer or empty options
        const validQuestions = questionsResponse.data.filter(q => 
          q.options.length > 0 && q.correct_answer !== null
        );
        
        const formattedQuestions = validQuestions.map((q) => {
          // Safely access answer_id with null check
          const correctAnswerId = q.correct_answer?.answer_id || 0;
          
          return {
            id: q.id.toString(),
            text: q.question,
            options: q.options.map((opt) => opt.answer),
            correctAnswerId: correctAnswerId
          };
        });
        
        setQuestions(formattedQuestions);

        // Fetch quiz score
        const scoreResponse = await apiClient.get<QuizScore>(`/course/quiz/score/${courseId}`);
        setQuizScore(scoreResponse.data);

        // Retrieve answers from localStorage
        const storedAnswers = localStorage.getItem(`quiz-answers-${courseId}`);
        if (storedAnswers) {
          setAnswers(JSON.parse(storedAnswers));
        }
        
        // If the quiz was passed, update the progress context
        if (scoreResponse.data.score >= settingsResponse.data.passmark) {
          if (courseId) {
            // Mark the section as complete in the context
            markSectionComplete(parseInt(courseId), parseInt(courseId));
            setAlertMsg("Your progress has been updated!");
            setAlertSeverity('purple');
            setAlertOpen(true);
          }
        }
      } catch (err: any) {
        console.error('Error fetching quiz results:', err.response?.data || err.message);
        setError('Failed to load quiz results');
        setAlertMsg('Failed to load quiz results');
        setAlertSeverity('error');
        setAlertOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResults();
  }, [courseId, apiClient, markSectionComplete]);

  const handleClose = () => {
    // Clear stored answers
    if (courseId) {
      localStorage.removeItem(`quiz-answers-${courseId}`);
    }
    navigate(`/started-course/${courseId}`);
  };

  const handleBannerClick = () => {
    if (courseId) {
      localStorage.removeItem(`quiz-answers-${courseId}`);
    }
    navigate(`/started-course/${courseId}`);
  };

  const handleRetryQuiz = () => {
    if (courseId) {
      localStorage.removeItem(`quiz-answers-${courseId}`);
      navigate(`/quiz/${courseId}`);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (error || !quizSettings || !quizScore) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-red-500 text-xs">{error || 'Quiz results not found'}</p>
      </div>
    );
  }

  // Check if the quiz was passed
  const passed = quizScore.score >= quizSettings.passmark;

  return (
    <div className="w-full h-full overflow-y-auto py-15 bg-white">
      {/* Header */}
      <div className="flex items-start px-70 max-sm:px-4 max-md:px-6 max-lg:px-8 gap-4 pb-6">
        <div onClick={handleClose} className="cursor-pointer">
          <QuizCloseSVG size={30} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl max-sm:text-xl max-md:text-2xl font-bold">Course Quiz</h1>
          <div className="text-md max-sm:text-sm font-bold text-gray-600 mt-1">
            {questions.length} Questions • {Math.floor(quizSettings.duration / 60000)} mins
          </div>
        </div>
      </div>
      <hr className="border-gray-300" />

      {/* Banner */}
      {passed ? (
        <div className="px-70 max-sm:px-4 max-md:px-6 max-lg:px-8 py-4 bg-green-300 w-full">
          <div className="flex justify-between items-center max-sm:p-1 max-md:p-3 p-6">
            <div className="flex flex-col">
              <div className="text-2xl max-sm:text-[19px] max-md:text-xl font-bold">
                Congratulations!! You passed
              </div>
              <div className="text-sm mt-2">
                Course progress: {courseProgress}%
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBannerClick}
                className="bg-white max-sm:hidden py-2 px-6 rounded-lg font-medium"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-65 max-sm:px-4 max-md:px-6 max-lg:px-8 py-4 bg-red-400 w-full">
          <div className="flex justify-between items-center max-sm:p-1 max-md:p-3 p-6">
            <div className="flex flex-col">
              <div className="text-2xl max-sm:text-[19px] max-md:text-xl font-bold text-white">
                Sorry, you did not pass
              </div>
              <div className="text-sm text-white mt-2">
                Course progress: {courseProgress}%
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRetryQuiz}
                className="bg-[#68049B] text-white py-2 px-6 max-sm:hidden rounded-lg font-medium"
              >
                Retry Quiz
              </button>
              <button
                onClick={handleBannerClick}
                className="bg-white py-2 px-6 max-sm:hidden rounded-lg font-medium"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score summary */}
      <div className="px-70 max-sm:px-4 max-md:px-6 max-lg:px-8 py-8">
        <div className="bg-gray-100 p-6 max-sm:p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Score Summary</h2>
          <div className="flex max-sm:flex-col max-md:gap-3 justify-between items-center">
            <div>
              <p>Required to Pass: {quizSettings.passmark}%</p>
              <p>Your Score: {quizScore.score}%</p>
            </div>
            <div>
              <p>Correct Answers: {quizScore.correct}</p>
              <p>Incorrect Answers: {quizScore.incorrect}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions recap */}
      <div className="flex px-70 max-sm:px-4 max-md:px-6 max-lg:px-8 flex-col w-[60%] max-lg:w-[80%] max-md:w-[90%] max-sm:w-full my-5 gap-3">
        <h2 className="text-xl font-bold">Question Review</h2>
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const correctAnswerId = q.correctAnswerId;
          // Use a safer way to get the correct answer, handling potential out-of-bounds
          const correctAnswerIndex = correctAnswerId > 0 && correctAnswerId <= q.options.length 
            ? correctAnswerId - 1 
            : -1;
          const correctAnswer = correctAnswerIndex >= 0 ? q.options[correctAnswerIndex] : "Unknown";

          return (
            <React.Fragment key={q.id}>
              <div className="py-6 w-full max-sm:px-4">
                <div className="flex flex-col gap-4">
                  <div className="font-bold">
                    {idx + 1}. {q.text}
                  </div>
                  <div className="flex flex-col gap-3">
                    {q.options.map((opt) => {
                      const isSelected = opt === userAnswer;
                      const isCorrect = opt === correctAnswer;
                      return (
                        <div
                          key={opt}
                          className={`flex items-center gap-3 text-sm p-2 rounded ${
                            isSelected && isCorrect
                              ? "bg-green-100"
                              : isSelected && !isCorrect
                              ? "bg-red-100"
                              : isCorrect
                              ? "bg-green-50"
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            disabled
                            checked={isSelected}
                            className="form-radio h-4 w-4"
                          />
                          <span>{opt}</span>
                          {isSelected && !isCorrect && (
                            <span className="ml-2 text-red-500 max-sm:text-xs">
                              Incorrect answer
                            </span>
                          )}
                          {isCorrect && (
                            <span className="ml-2 text-green-500 max-sm:text-xs">
                              Correct answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <hr className="border-gray-300 mt-4" />
              </div>
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Add AlertMessage component */}
      <AlertMessage
        open={alertOpen}
        message={alertMsg}
        severity={alertSeverity}
        onClose={() => setAlertOpen(false)}
      />
    </div>
  );
};

export default QuizResultsPage;