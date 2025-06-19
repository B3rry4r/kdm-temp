import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import AlertMessage from '../../../components/AlertMessage';

const CertificatePage: React.FC = () => {
  const { apiClient } = useAuth();
  const [activeTab, setActiveTab] = useState<'payment' | 'institution'>('payment');
  const [institutionCode, setInstitutionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/quiz/access/pay', {
        amount: 2500,
        type: 2, // Quiz payment
        redirect_url: `${window.location.origin}/super-quiz/certificate/download`,
      });
      if (response.data.link) {
        window.location.href = response.data.link;
      } else {
        setError('Could not initiate payment. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'An error occurred while initiating payment.';
      setError(errorMsg);
      setLoading(false);
    }
  };

  const handleInstitutionCode = async () => {
    if (!institutionCode) {
      setError('Please enter an institution code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/quiz/access', {
        type: 3, // 3 for Super Quiz Certificate
        code: institutionCode,
        status: 1,
        amount: 0,
      });
      if (response.data.certificate_url) {
        localStorage.setItem('certificate_url', response.data.certificate_url);
        localStorage.setItem('quiz_type', 'super-quiz');
        window.location.href = '/super-quiz/certificate/download';
      } else {
        setError('Invalid institution code or an error occurred.');
        setLoading(false);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to validate institution code.';
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto py-15 bg-[#FFFEF6] flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Download Certificate</h1>

        {error && <AlertMessage message={error} open={!!error} onClose={() => setError(null)} />}

        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex-1 py-2 px-4 font-semibold text-center transition-colors duration-300 ${activeTab === 'payment' ? 'border-b-2 border-[#68049B] text-[#68049B]' : 'text-gray-500 hover:text-gray-700'}`}>
            Pay
          </button>
          <button
            onClick={() => setActiveTab('institution')}
            className={`flex-1 py-2 px-4 font-semibold text-center transition-colors duration-300 ${activeTab === 'institution' ? 'border-b-2 border-[#68049B] text-[#68049B]' : 'text-gray-500 hover:text-gray-700'}`}>
            Use Institution Code
          </button>
        </div>

        {activeTab === 'payment' ? (
          <div className="flex flex-col gap-4">
            <p className="text-center text-gray-600">To download your Super Certificate, please complete the payment of ₦2,500.</p>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-[#FFD600] hover:bg-[#FFB800] text-black font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <div className="loader"></div> : 'Proceed to Payment'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-center text-gray-600">If you have an institution code, please enter it below.</p>
            <input
              type="text"
              value={institutionCode}
              onChange={(e) => setInstitutionCode(e.target.value)}
              placeholder="Enter your code"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD600] focus:border-transparent"
            />
            <button
              onClick={handleInstitutionCode}
              disabled={loading}
              className="w-full bg-[#FFD600] hover:bg-[#FFB800] text-black font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <div className="loader"></div> : 'Get Certificate'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatePage;
