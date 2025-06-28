import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import AlertMessage from '../../../components/AlertMessage';
import certificateImage from '../../../assets/cert.png'; // You can swap this for a different LMS certificate image if needed

const LmsCertificateDownloadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    // Check for payment status from Flutterwave redirect
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (status === 'successful' || status === 'success') {
      setCanAccess(true);
    } else {
      setError('Payment not completed or failed. Please complete the payment to access your certificate.');
    }
    setLoading(false);
  }, [location.search]);

  const handleDownload = () => {
    if (certificateRef.current) {
      html2canvas(certificateRef.current, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'px', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('Kudimata_LMS_Certificate.pdf');
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto py-8 bg-[#FFFEF6] flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full bg-white p-6 rounded-lg shadow-lg text-center">
        {error && (
          <div className='mb-4'>
            <AlertMessage message={error} open={!!error} onClose={() => setError(null)} />
          </div>
        )}
        {canAccess ? (
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-bold">Congratulations, {user?.firstname}!</h1>
            <p className="text-gray-600">Your certificate is ready. You can download it below.</p>
            <div 
              ref={certificateRef} 
              className="relative w-[842px] h-[595px] bg-cover bg-center text-black"
              style={{ backgroundImage: `url(${certificateImage})` }}
            >
              <p 
                className="absolute font-bold text-gray-900 text-5xl left-[30px] top-[200px]"
              >
                {`${user?.firstname} ${user?.lastname}`}
              </p>
              <p className="absolute font-bold text-gray-900 text-[11px] left-[56px] top-[357px]">{new Date().getDate() + '/' + (new Date().getMonth() + 1) + '/' + new Date().getFullYear()}</p>
            </div>
            <button
              onClick={handleDownload}
              className="w-1/2 bg-[#FFD600] hover:bg-[#FFB800] text-black font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center mt-4"
            >
              Download Certificate
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold text-red-600">Download Failed</h1>
            <p className="text-gray-600">We could not retrieve your certificate. Please try again or contact support if the issue persists.</p>
            <button
              onClick={() => navigate('/my-courses')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              Back to My Courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LmsCertificateDownloadPage;
