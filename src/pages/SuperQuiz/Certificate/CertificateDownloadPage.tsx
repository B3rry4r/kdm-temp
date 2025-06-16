import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import AlertMessage from '../../../components/AlertMessage';

const CertificateDownloadPage: React.FC = () => {
  const { apiClient } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);

  useEffect(() => {
    const getCertificate = async () => {
      setLoading(true);
      setError(null);

      const storedUrl = localStorage.getItem('certificate_url');
      if (storedUrl) {
        setCertificateUrl(storedUrl);
        localStorage.removeItem('certificate_url');
        localStorage.removeItem('quiz_type');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams(location.search);
      const paymentId = params.get('reference');
      if (!paymentId) {
        setError('Payment reference not found. Your payment may not have been successful.');
        setLoading(false);
        return;
      }

      const quizType = localStorage.getItem('quiz_type');
      let requestData = { type: 0, amount: 0 };

      switch (quizType) {
        case 'financial-literacy':
          requestData = { type: 1, amount: 500 };
          break;
        case 'kickstart-my-biz':
          requestData = { type: 2, amount: 500 };
          break;
        case 'super-quiz':
          requestData = { type: 3, amount: 2500 };
          break;
        default:
          setError('Invalid quiz type specified.');
          setLoading(false);
          return;
      }

      try {
        const response = await apiClient.post('/quiz/access', {
          ...requestData,
          status: 1,
          payment_id: paymentId,
        });

        if (response.data.certificate_url) {
          setCertificateUrl(response.data.certificate_url);
          localStorage.removeItem('quiz_type');
        } else {
          setError('Could not retrieve your certificate. Please contact support.');
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'An error occurred while verifying your payment.';
        setError(errorMsg);
      }
      setLoading(false);
    };

    getCertificate();
  }, [apiClient, location]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto py-15 bg-[#FFFEF6] flex items-center justify-center">
      <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-lg text-center">
        {error && (
          <div className='mb-4'>
            <AlertMessage message={error} open={!!error} onClose={() => setError(null)} />
          </div>
        )}

        {certificateUrl ? (
          <div className="flex flex-col items-center gap-6">
            <img src='/certificate_badge.png' alt='Success' className='w-24 h-24' />
            <h1 className="text-2xl font-bold">Congratulations!</h1>
            <p className="text-gray-600">Your certificate is ready for download.</p>
            <a
              href={certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#FFD600] hover:bg-[#FFB800] text-black font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center"
            >
              Download Certificate
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold text-red-600">Download Failed</h1>
            <p className="text-gray-600">We could not retrieve your certificate. Please try again or contact support if the issue persists.</p>
            <button
              onClick={() => navigate('/super-quiz')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              Back to Quizzes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateDownloadPage;
