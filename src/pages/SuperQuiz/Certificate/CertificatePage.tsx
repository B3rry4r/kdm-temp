import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { Alert, Loader } from '@mantine/core';

const CertificatePage: React.FC = () => {
  const { apiClient } = useAuth();
  const [activeTab, setActiveTab] = useState<'payment' | 'institution'>('payment');
  const [institutionCode, setInstitutionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/quiz/access/pay', {
        amount: 2500, // As per instructions
        type: 2, // Quiz payment
        redirect_url: `${window.location.origin}/super-quiz/certificate/download`,
      });
      // Redirect user to payment gateway
      if (response.data.authorization_url) {
        window.location.href = response.data.authorization_url;
      } else {
        setError('Could not initiate payment. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred while initiating payment.');
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
        type: 1,
        code: institutionCode,
        status: 1, // Assuming status is required here
        amount: 0, // No amount for institution code
      });
      if (response.data.certificate_url) {
        setCertificateUrl(response.data.certificate_url);
      } else {
        setError('Invalid institution code or an error occurred.');
      }
    } catch (err) {
      setError('Failed to validate institution code.');
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">Download Your Certificate</h1>

      {error && <Alert color="red" title="Error" className="mb-4">{error}</Alert>}

      {certificateUrl ? (
        <div className="text-center">
          <p className="text-lg mb-4">Your certificate is ready!</p>
          <a
            href={certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600 transition duration-300"
          >
            Download Certificate
          </a>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab('payment')}
              className={`py-2 px-4 font-semibold ${activeTab === 'payment' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>
              Pay with Card
            </button>
            <button
              onClick={() => setActiveTab('institution')}
              className={`py-2 px-4 font-semibold ${activeTab === 'institution' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>
              Use Institution Code
            </button>
          </div>

          {activeTab === 'payment' ? (
            <div>
              <p className="mb-4">To download your certificate, please complete the payment of ₦2,500.</p>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition duration-300 flex items-center justify-center"
              >
                {loading ? <Loader size="sm" /> : 'Proceed to Payment'}
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-4">If you have an institution code, please enter it below to get your certificate.</p>
              <input
                type="text"
                value={institutionCode}
                onChange={(e) => setInstitutionCode(e.target.value)}
                placeholder="Enter your code"
                className="w-full p-2 border rounded mb-4"
              />
              <button
                onClick={handleInstitutionCode}
                disabled={loading}
                className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition duration-300 flex items-center justify-center"
              >
                {loading ? <Loader size="sm" /> : 'Get Certificate'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CertificatePage;
