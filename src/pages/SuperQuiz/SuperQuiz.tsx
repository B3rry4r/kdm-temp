import React from "react";
import { useNavigate } from "react-router-dom";

interface QuizCardProps {
  title: string;
  description: string;
  attempts: string;
  imgAlt: string;
  onClick: () => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ title, description, attempts, imgAlt, onClick }) => (
  <div
    className="bg-[#FFFFFF] rounded-md shadow-sm p-0 flex flex-col cursor-pointer hover:shadow-lg transition w-full max-w-[370px] min-h-[420px]"
    onClick={onClick}
    tabIndex={0}
    role="button"
    aria-pressed="false"
  >
    <div className="flex items-center justify-center p-4 pb-0">
      {/* Placeholder for image */}
      <div className="w-full h-[210px] bg-[#F3E9DF] rounded-sm flex items-center justify-center">
        <span className="text-gray-400 text-xl">{imgAlt}</span>
      </div>
    </div>
    <div className="px-4 pb-6 pt-2 flex flex-col gap-2">
      <h3 className="text-xl font-bold text-[#231F20]">{title}</h3>
      <p className="text-sm text-[#6B6B6B] leading-snug mb-2">{description}</p>
      <span className="text-xs text-[#6B6B6B]">{attempts}</span>
    </div>
  </div>
);

const quizzes = [
  {
    key: 'financial',
    title: 'Financial Literacy Quiz',
    description: 'Unlock Your Financial Potential with the Kudimata Financial Literacy Quiz!',
    attempts: 'Attempts left this month: 3/3',
    imgAlt: 'Financial Literacy Image',
    route: '/quiz/financial-literacy',
  },
  {
    key: 'biz',
    title: 'Kickstart My Biz Quiz',
    description: 'Discover the perfect next step for your entrepreneurial journey',
    attempts: 'Attempts left this month: 3/3',
    imgAlt: 'Biz Quiz Image',
    route: '/quiz/kickstart-my-biz',
  },
];

const SuperQuiz: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="h-full overflow-x-scroll px-4 py-8 md:py-12 md:px-8 flex flex-col">
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-[#231F20] mb-2">Quiz</h1>
        <p className="text-lg text-[#6B6B6B] mb-8 max-w-xl">
          Get tailored insights to boost your financial and entrepreneurial goals
        </p>
        <div className="flex flex-wrap gap-8">
          {quizzes.map(q => (
            <QuizCard
              key={q.key}
              title={q.title}
              description={q.description}
              attempts={q.attempts}
              imgAlt={q.imgAlt}
              onClick={() => navigate(q.route)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperQuiz;