import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QuizCloseSVG } from "../../../assets/icons/icons";
import { useAuth } from "../../../context/AuthContext/AuthContext";

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

  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [quizScore, setQuizScore] = useState<QuizScore | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const formattedQuestions = questionsResponse.data.map((q) => ({
          id: q.id.toString(),
          text: q.question,
          options: q.options.map((opt) => opt.answer),
          correctAnswerId: q.correct_answer.answer_id,
        }));
        setQuestions(formattedQuestions);

        // Fetch quiz score
        const scoreResponse = await apiClient.get<QuizScore>(`/course/quiz/score/${courseId}`);
        setQuizScore(scoreResponse.data);

        // Retrieve answers from localStorage
        const storedAnswers = localStorage.getItem(`quiz-answers-${courseId}`);
        if (storedAnswers) {
          setAnswers(JSON.parse(storedAnswers));
        }
      } catch (err: any) {
        console.error('Error fetching quiz results:', err.response?.data || err.message);
        setError('Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResults();
  }, [courseId, apiClient]);

  const handleClose = () => {
    // Clear stored answers
    if (courseId) {
      localStorage.removeItem(`quiz-answers-${courseId}`);
    }
    navigate(`/course/${courseId}`);
  };

  const handleBannerClick = () => {
    if (courseId) {
      localStorage.removeItem(`quiz-answers-${courseId}`);
    }
    navigate(`/course/${courseId}`);
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

  // const total = questions.length;
  const passed = quizScore.score >= quizSettings.passmark;

  return (
    <div className="w-full h-full overflow-y-auto py-15 bg-white">
      {/* Header */}
      <div className="flex items-start px-70 max-sm:px-4 gap-4 pb-6">
        <div onClick={handleClose} className="cursor-pointer">
          <QuizCloseSVG size={30} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl max-sm:text-xl font-bold">Course Quiz</h1>
          <div className="text-md font-bold text-gray-600 mt-1">
            {questions.length} Questions • {quizSettings.duration} mins
          </div>
        </div>
      </div>
      <hr className="border-gray-300" />

      {/* Banner */}
      {passed ? (
        <div className="px-70 max-sm:px-4 py-4 bg-green-300 w-full">
          <div className="flex justify-between items-center max-sm:p-1 p-6">
            <div className="text-2xl max-sm:text-[19px] font-bold">
              Congratulations!! You passed
            </div>
            <button
              onClick={handleBannerClick}
              className="bg-white max-sm:hidden py-2 px-6 rounded-lg font-medium"
            >
              Go back
            </button>
          </div>
        </div>
      ) : (
        <div className="px-65 max-sm:px-4 py-4 bg-red-400 w-full">
          <div className="flex justify-between items-center max-sm:p-1 p-6">
            <div className="text-2xl max-sm:text-[19px] font-bold text-white">Sorry, you did not pass</div>
            <button
              onClick={handleBannerClick}
              className="bg-white py-2 px-6 max-sm:hidden rounded-lg font-medium"
            >
              Go back
            </button>
          </div>
        </div>
      )}

      {/* Questions recap */}
      <div className="flex px-70 w-full max-sm:px-4 max-sm:w-full flex-col w-[60%] max-sm: my-5 gap-3">
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const correctAnswerId = q.correctAnswerId;
          const correctAnswer = q.options[correctAnswerId - 1]; // Adjust for zero-based index

          return (
            <React.Fragment key={q.id}>
              <div className="py-6 w-[60%] max-sm:w-full max-sm:px-4">
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
                          className="flex items-center gap-3 text-sm"
                        >
                          <input
                            type="radio"
                            disabled
                            checked={isSelected}
                            className="form-radio h-4 w-4"
                          />
                          <span>{opt}</span>
                          {isSelected && !isCorrect && (
                            <span className="ml-2 text-red-500">
                              Incorrect answer
                            </span>
                          )}
                          {isCorrect && (
                            <span className="ml-2 text-green-500">
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
    </div>
  );
};

export default QuizResultsPage;