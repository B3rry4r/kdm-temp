import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/AuthContext";

const KickstartMyBizQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { apiClient } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await apiClient.post('/quiz/check', { type: 2 });
        const { kmb_tries, has_taken_kmb, eligible_for_kmb, token } = response.data;

        if (token) {
          localStorage.setItem('kudimata_quiz_token', token);
        } else {
          localStorage.removeItem('kudimata_quiz_token');
        }

        if (!eligible_for_kmb) {
          navigate('/super-quiz');
          return;
        }

        if (has_taken_kmb && (kmb_tries || 0) >= 3) {
          navigate('/super-quiz/kickstart-my-biz/results');
          return;
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to verify quiz eligibility.");
        setLoading(false);
        console.error(err);
      }
    };

    checkStatus();
  }, [apiClient, navigate]);

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

  return (
    <div className="w-full h-full flex flex-col md:flex-row items-center justify-between gap-8 p-4 md:p-12">
      {/* Left: Text Content */}
      <div className="flex-1 max-w-xl flex flex-col justify-center items-center md:items-start text-center md:text-left">
        <button
          className="w-10 h-10 rounded-full bg-[#FFF6E8] flex items-center justify-center mb-8 hover:bg-[#F3E9DF] transition"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M13 16l-4-4 4-4" stroke="#3A2E1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="text-2xl font-bold text-[#231F20] mb-3">Kickstart My Biz Quiz</h1>
        <p className="text-sm text-[#6B6B6B] mb-4">Ready to Kickstart Your Business Growth?</p>
        <p className="text-sm text-[#3A2E1D] mb-4">
          Discover the perfect next step for your entrepreneurial journey with the Kudimata Kickstart My Biz Quiz!<br />
          This quick, insightful assessment will help you identify key opportunities, refine your strategy, and unlock tailored resources to accelerate your success.
        </p>
        <ul className="list-disc pl-5 text-sm text-[#3A2E1D] mb-8">
          <li>Personalized insights in minutes</li>
          <li>Actionable steps tailored to your business</li>
          <li>Expert-backed strategies to fuel growth</li>
        </ul>
        <button
          className="flex w-full md:w-auto justify-center items-center gap-2 bg-[#FFD30F] hover:brightness-95 transition text-black font-semibold text-sm rounded-md px-4 cursor-pointer py-3 mt-2 shadow-sm"
          onClick={() => navigate('/quiz/kickstart-my-biz/start')}
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
          <span className="text-gray-400 text-xl">Kickstart My Biz Image</span>
        </div>
      </div>
    </div>
  );
};

export default KickstartMyBizQuiz;
