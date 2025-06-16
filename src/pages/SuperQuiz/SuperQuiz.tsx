import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import flq from "../../assets/flq.png";
import kmb from "../../assets/kmb.png";

interface QuizStatus {
  has_taken_fl: boolean;
  has_taken_kmb: boolean;
  fl_tries: number | null;
  kmb_tries: number | null;
  eligible_for_kmb: boolean;
  token: string | null;
}

interface QuizCardProps {
  title: string;
  description: string;
  attempts: string;
  imgAlt: string;
  onClick: () => void;
  disabled?: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({ title, description, attempts, imgAlt, onClick, disabled }) => (
  <div
    className={`bg-[#FFFFFF] rounded-md shadow-sm p-0 flex flex-col transition w-full max-w-[370px] min-h-[420px] ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
    onClick={!disabled ? onClick : undefined}
    tabIndex={disabled ? -1 : 0}
    role="button"
    aria-pressed="false"
    aria-disabled={disabled}
  >
    <div className="flex items-center justify-center p-4 pb-0">
      <div className="w-full h-[210px] bg-[#F3E9DF] rounded-sm flex items-center justify-center">
        <img src={imgAlt} alt={title} className="w-full h-full object-contain" />
      </div>
    </div>
    <div className="px-4 pb-6 pt-2 flex flex-col gap-2">
      <h3 className="text-xl font-bold text-[#231F20]">{title}</h3>
      <p className="text-sm text-[#6B6B6B] leading-snug mb-2">{description}</p>
      <span className="text-xs text-[#6B6B6B]">{attempts}</span>
    </div>
  </div>
);

const SuperQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { apiClient } = useAuth();
  const [quizStatus, setQuizStatus] = useState<QuizStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canDownloadSuperCertificate, setCanDownloadSuperCertificate] = useState(false);

  useEffect(() => {
    const fetchQuizStatus = async () => {
      try {
        const response = await apiClient.post('/quiz/check', { type: 1 });
        setQuizStatus(response.data);
        if (response.data.token) {
          localStorage.setItem('kudimata_quiz_token', response.data.token);
        } else {
          localStorage.removeItem('kudimata_quiz_token');
        }
      } catch (err) {
        setError("Failed to check quiz status.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizStatus();

    const checkCourseCompletion = async () => {
      try {
        const response = await apiClient.get<any[]>('/my/courses');
        const courses = response.data;

        const hasCompletedKMB = courses.some(
          (course: any) =>
            course.course_title?.includes('Kickstart My Biz') &&
            course.course_status === 'completed'
        );

        const hasCompletedFL = courses.some(
          (course: any) =>
            course.course_title?.includes('Financial Literacy') &&
            course.course_status === 'completed'
        );

        if (hasCompletedKMB && hasCompletedFL) {
          setCanDownloadSuperCertificate(true);
        }
      } catch (error) {
        console.error('Failed to check course completion status', error);
      }
    };

    checkCourseCompletion();
  }, [apiClient]);

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

  const flAttemptsLeft = quizStatus ? 20 - (quizStatus.fl_tries || 0) : 20;
  const kmbAttemptsLeft = quizStatus ? 20 - (quizStatus.kmb_tries || 0) : 20;

  const quizzesData = [
    {
      key: 'financial',
      title: 'Financial Literacy Quiz',
      description: 'Unlock Your Financial Potential with the Kudimata Financial Literacy Quiz!',
      attempts: `Attempts left this month: ${flAttemptsLeft < 0 ? 0 : flAttemptsLeft}/20`,
      imgAlt: flq,
      disabled: flAttemptsLeft <= 0 && quizStatus?.has_taken_fl,
      onClick: () => {
        if (flAttemptsLeft <= 0 && quizStatus?.has_taken_fl) {
          navigate('/super-quiz/financial-literacy/results');
        } else {
          navigate('/quiz/financial-literacy');
        }
      },
    },
    {
      key: 'biz',
      title: 'Kickstart My Biz Quiz',
      description: 'Discover the perfect next step for your entrepreneurial journey',
      attempts: `Attempts left this month: ${kmbAttemptsLeft < 0 ? 0 : kmbAttemptsLeft}/20`,
      imgAlt: kmb,
      disabled: !quizStatus?.eligible_for_kmb,
      onClick: () => {
        if (quizStatus?.eligible_for_kmb) {
          if (kmbAttemptsLeft <= 0 && quizStatus?.has_taken_kmb) {
            navigate('/super-quiz/kickstart-my-biz/results');
          } else {
            navigate('/quiz/kickstart-my-biz');
          }
        }
      },
    },
  ];

  return (
    <div className="h-full overflow-y-auto px-4 py-8 md:py-12 md:px-8 flex flex-col">
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-[#231F20] mb-2">Quiz</h1>
        <p className="text-lg text-[#6B6B6B] mb-8 max-w-xl">
          Get tailored insights to boost your financial and entrepreneurial goals
        </p>
        <div className="flex flex-wrap gap-8">
          {quizzesData.map(q => (
            <QuizCard
              key={q.key}
              title={q.title}
              description={q.description}
              attempts={q.attempts}
              imgAlt={q.imgAlt}
              onClick={q.onClick}
              disabled={q.disabled}
            />
          ))}
        </div>

      </div>
      {canDownloadSuperCertificate && (
            <div className="flex max-w-6xl justify-center mt-20 w-full">
              <button
                className="bg-[#68049B] hover:bg-[#54037d] text-white font-bold px-6 py-3 rounded-lg shadow-lg w-full md:w-auto"
                onClick={() => navigate('/super-quiz/certificate')}
              >
                Download Super Certificate
              </button>
            </div>
          )}
    </div>
  );
};

export default SuperQuiz;