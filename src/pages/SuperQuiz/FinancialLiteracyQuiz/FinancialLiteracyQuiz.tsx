import React from "react";
import { useNavigate } from "react-router-dom";

const FinancialLiteracyQuiz: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full h-full flex flex-col md:flex-row items-center justify-between gap-8 p-4 md:p-12">
      {/* Left: Text Content */}
      <div className="flex-1 max-w-xl flex flex-col justify-center">
        <button
          className="w-10 h-10 rounded-full bg-[#FFF6E8] flex items-center justify-center mb-8 hover:bg-[#F3E9DF] transition"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M13 16l-4-4 4-4" stroke="#3A2E1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="text-2xl font-bold text-[#231F20] mb-3">Financial Literacy Quiz</h1>
        <p className="text-sm text-[#3A2E1D] mb-2">
          Unlock Your Financial Potential with the Kudimata Financial Literacy Quiz!
        </p>
        <p className="text-sm text-[#3A2E1D] mb-4">
          How well do you understand your money?<br />
          Take the Kudimata Financial Literacy Quiz to assess your knowledge, uncover insights, sharpen your financial decision-making skills, and earn an entry-level certificate.
        </p>
        <p className="text-sm text-[#3A2E1D] mb-8">
          In just a few minutes, you’ll discover key strengths and areas for growth, helping you build confidence and control over your financial future.
        </p>
        <button
          className="flex w-45 items-center gap-2 bg-[#FFD30F] hover:brightness-95 transition text-black font-semibold text-sm rounded-md px-4 cursor-pointer py-3 mt-2 shadow-sm"
          onClick={() => navigate('/quiz/financial-literacy/start')}
        >
          Proceed to Quiz
          <span className="ml-2">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M8 5l5 5-5 5" stroke="#231F20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
        </button>
      </div>
      {/* Right: Image Placeholder */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[420px] h-[320px] md:h-[420px] bg-[#F3E9DF] rounded-md flex items-center justify-center">
          <span className="text-gray-400 text-xl">Financial Literacy Image</span>
        </div>
      </div>
    </div>
  );
};

export default FinancialLiteracyQuiz;