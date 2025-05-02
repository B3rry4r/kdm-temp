import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QuizCloseSVG } from "../../../assets/icons/icons";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AlertMessage from "../../../components/AlertMessage";

// API types (raw response)
interface QuizQuestionOptionAPI {
  id: number;
  question_id: number;
  answer: string;
}

interface QuizQuestionCorrectAnswerAPI {
  id: number;
  question_id: number;
  answer_id: number; // This is the ID of the correct QuizQuestionOptionAPI
}

interface QuizQuestionAPI {
  id: number; // Question ID
  course_id: number;
  question: string;
  options: QuizQuestionOptionAPI[];
  correct_answer: QuizQuestionCorrectAnswerAPI | null;
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

// Processed type for component state
interface Option {
  id: number;
  text: string;
}
interface Question {
  id: string; // Keep as string ID for consistency with localStorage keys
  text: string;
  options: Option[];
  correctAnswerOptionId: number | null; // Store the ID of the correct option
}

const QuizResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { apiClient } = useAuth();

  // State for processed data
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [quizScore, setQuizScore] = useState<QuizScore | null>(null);
  // State to store selected answers as { questionId: selectedOptionId | null }
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'purple' | 'success' | 'error'>('purple');

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

        // Fetch settings and score
        const [settingsResponse, scoreResponse] = await Promise.all([
            apiClient.get<QuizSettings>(`/course/quiz/settings/${courseId}`),
            apiClient.get<QuizScore>(`/course/quiz/score/${courseId}`)
        ]);
        setQuizSettings(settingsResponse.data);
        setQuizScore(scoreResponse.data);
        console.log("Fetched Settings:", settingsResponse.data);
        console.log("Fetched Score:", scoreResponse.data);

        // Fetch raw questions
        const questionsResponse = await apiClient.get<QuizQuestionAPI[]>(`/course/quiz/questions/${courseId}`);
        const rawQuestions: QuizQuestionAPI[] = questionsResponse.data;
        console.log("Fetched Raw Questions:", rawQuestions);

        // Process raw questions into the format needed for display
        const formattedQuestions: Question[] = rawQuestions.map(q => ({
          id: q.id.toString(),
          text: q.question,
          options: q.options.map(opt => ({ id: opt.id, text: opt.answer })),
          correctAnswerOptionId: q.correct_answer?.answer_id ?? null,
        }));
        setQuestions(formattedQuestions);
        console.log("Formatted Questions for Display:", formattedQuestions);

        // Retrieve the final answers map { questionId: selectedOptionId } directly from localStorage
        const finalAnswersRaw = localStorage.getItem(`quiz-final-answers-${courseId}`);
        let finalAnswers: Record<string, number | null> = {}; // Default to empty object
        if (finalAnswersRaw) {
            try {
                finalAnswers = JSON.parse(finalAnswersRaw);
                console.log(`Retrieved final answers from localStorage (quiz-final-answers-${courseId}):`, finalAnswers);
            } catch (e) {
                console.error("Failed to parse final answers from localStorage:", e);
                setError("Could not load your previously selected answers.");
                // Keep finalAnswers as empty object
            }
        } else {
             console.warn(`No final answers found in localStorage for key: quiz-final-answers-${courseId}`);
             // Potentially show a message if answers are expected but not found
             // setError("Could not find your submitted answers.");
        }
        setAnswers(finalAnswers); // Set the state with the retrieved ID map

        // Mark progress if passed
        if (scoreResponse.data.score >= settingsResponse.data.passmark && courseId) {
           const numericCourseId = parseInt(courseId);
           if (!isNaN(numericCourseId)) {
              //  markSectionComplete(numericCourseId, numericCourseId); // Use numeric ID
               console.log(`Marking section ${numericCourseId} complete.`);
               setAlertMsg("Your progress has been updated!");
               setAlertSeverity('purple');
               setAlertOpen(true);
           } else {
               console.error("Invalid courseId for marking completion:", courseId);
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
  }, [courseId, apiClient]); // Dependencies

  // --- Handler functions (handleClose, handleBannerClick, handleRetryQuiz) remain the same ---
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

  // --- Loading and Error states remain the same ---
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
          <h1 className="text-3xl max-sm:text-xl max-md:text-2xl font-bold">Course Quiz Results</h1>
          <div className="text-md max-sm:text-sm font-bold text-gray-600 mt-1">
             {questions.length} Questions • Passmark: {quizSettings.passmark}%
          </div>
        </div>
      </div>
      <hr className="border-gray-300" />

      {/* Banner (remains the same) */}
       {passed ? (
        <div className="px-70 max-sm:px-4 max-md:px-6 max-lg:px-8 py-4 bg-green-300 w-full">
          <div className="flex justify-between items-center max-sm:p-1 max-md:p-3 p-6">
            <div className="flex flex-col">
              <div className="text-2xl max-sm:text-[19px] max-md:text-xl font-bold">
                Congratulations!! You passed
              </div>
              <div className="text-sm mt-2">
                {/* Course progress: {courseProgress}% */}
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
                {/* Course progress: {courseProgress}% */}
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

      {/* Score summary (remains the same) */}
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


      {/* Questions recap -- MODIFIED LOGIC */}
      <div className="flex px-70 max-sm:px-4 max-md:px-6 max-lg:px-8 flex-col w-[60%] max-lg:w-[80%] max-md:w-[90%] max-sm:w-full my-5 gap-3">
        <h2 className="text-xl font-bold">Question Review</h2>
        {questions.map((q, idx) => {
          // Get the selected option ID for this question from the 'answers' state
          const selectedOptionId = answers[q.id];
          // Get the correct option ID for this question
          const correctAnswerOptionId = q.correctAnswerOptionId;

          return (
            <React.Fragment key={q.id}> {/* Use question ID as key */}
              <div className="py-6 w-full max-sm:px-4">
                <div className="flex flex-col gap-4">
                  <div className="font-bold">
                    {idx + 1}. {q.text}
                  </div>
                  <div className="flex flex-col gap-3">
                    {/* Iterate through options which are now { id: number, text: string } */}
                    {q.options.map((opt) => {
                       // Determine if this option was selected by comparing IDs
                      const isSelected = opt.id === selectedOptionId;
                       // Determine if this option is the correct one by comparing IDs
                      const isCorrect = opt.id === correctAnswerOptionId;

                      return (
                        <div
                          key={opt.id} // Use option ID as key
                          className={`flex items-center gap-3 text-sm p-2 rounded ${
                            isSelected && isCorrect
                              ? "bg-green-100 border border-green-300" // Selected and Correct
                              : isSelected && !isCorrect
                              ? "bg-red-100 border border-red-300"   // Selected but Incorrect
                              : isCorrect
                              ? "bg-green-50 border border-green-200"  // Not selected but Correct (highlight lightly)
                              : "bg-gray-50"             // Not selected and Incorrect
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${q.id}`} // Group radios per question
                            disabled
                            checked={isSelected} // Check based on ID comparison
                            className="form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span>{opt.text}</span> {/* Display option text */}
                          {isSelected && !isCorrect && (
                            <span className="ml-auto text-red-600 font-semibold text-xs">
                              Your Answer (Incorrect)
                            </span>
                          )}
                           {isSelected && isCorrect && (
                            <span className="ml-auto text-green-600 font-semibold text-xs">
                              Your Answer (Correct)
                            </span>
                          )}
                          {isCorrect && !isSelected && (
                            <span className="ml-auto text-green-600 font-medium text-xs">
                              Correct Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                     {/* Add feedback if no answer was selected for this question */}
                    {selectedOptionId === null && (
                        <p className="text-sm text-gray-500 italic mt-2">You did not select an answer for this question.</p>
                    )}
                  </div>
                </div>
                <hr className="border-gray-300 mt-6" />
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* AlertMessage (remains the same) */}
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
