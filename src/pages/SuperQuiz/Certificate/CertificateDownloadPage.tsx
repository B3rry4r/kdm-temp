import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { Alert, Loader } from '@mantine/core';

const CertificateDownloadPage: React.FC = () => {
  const { apiClient } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);

  useEffect(() => {
    const verifyPaymentAndGetCertificate = async () => {
      const params = new URLSearchParams(location.search);
      const paymentId = params.get('reference'); // Common query param from payment gateways

      if (!paymentId) {
        setError('Payment reference not found. Your payment may not have been successful.');
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.post('/quiz/access', {
          type: 2,
          status: 1,
          payment_id: paymentId,
          amount: 2500,
        });

        if (response.data.certificate_url) {
          setCertificateUrl(response.data.certificate_url);
        } else {
          setError('Could not retrieve your certificate. Please contact support.');
        }
      } catch (err) {
        setError('An error occurred while verifying your payment.');
      }
      setLoading(false);
    };

    verifyPaymentAndGetCertificate();
  }, [apiClient, location]);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl text-center">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Certificate Download</h1>

      {loading && <Loader size="lg" />}
      {error && <Alert color="red" title="Error" className="mb-4">{error}</Alert>}

      {certificateUrl && (
        <div>
          <p className="text-lg mb-4">Congratulations! Your payment has been confirmed.</p>
          <a
            href={certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600 transition duration-300"
          >
            Download Your Certificate
          </a>
        </div>
      )}
    </div>
  );
};

export default CertificateDownloadPage;
