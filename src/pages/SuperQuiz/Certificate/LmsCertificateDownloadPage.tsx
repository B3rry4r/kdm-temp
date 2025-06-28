import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import AlertMessage from '../../../components/AlertMessage';
import certificateImage from '../../../assets/cert2.jpg';
import { useCourseCertificate } from '../../../context/CourseCertificateContext';

const LmsCertificateDownloadPage: React.FC = () => {
  const { certificateCourseTitle } = useCourseCertificate();

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canAccess, setCanAccess] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Check for payment status from Flutterwave redirect
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    console.log(status);
    // setCanAccess(true);
    if (status === 'successful' || status === 'success') {
      setCanAccess(true);
    } else {
      setError('Payment not completed or failed. Please complete the payment to access your certificate.');
    }
    setLoading(false);
  }, [location.search]);

  const downloadAsImage = async () => {
    if (!certificateRef.current || !imageLoaded) return;
    
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Set high resolution canvas size
      const scale = 3; // 3x resolution for crisp output
      const width = 940;
      const height = 695;
      
      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.scale(scale, scale);

      // Load and draw the background image
      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        bgImage.onload = resolve;
        bgImage.onerror = reject;
        bgImage.src = certificateImage;
      });

      // Draw background image
      ctx.drawImage(bgImage, 0, 0, width, height);

      // Set text properties for user name
      ctx.fillStyle = '#000000'; // Black color
      ctx.textBaseline = 'top';
      ctx.font = 'bold 48px helvetica';

      // Draw course title ~120px above user name
      const courseTitle = certificateCourseTitle || '[DEBUG: No course title set]';
      ctx.font = 'bold 30px helvetica';
      const courseTitleY = height * 0.63 - 140;
      ctx.fillText(courseTitle, 50, courseTitleY);

      // Draw user name - synced with JSX positioning (57% of 695px ≈ 396px)
      const nameY = height * 0.57; // 57% from top
      ctx.fillText(`${user?.firstname} ${user?.lastname}`, 50, nameY);

      // Set text properties for date
      ctx.font = 'bold 13px helvetica';
      
      // Draw date - synced with JSX positioning (67% of 695px ≈ 465px)
      const dateY = height * 0.67; // 67% from top
      const currentDate = new Date().getDate() + '/' + (new Date().getMonth() + 1) + '/' + new Date().getFullYear();
      ctx.fillText(`Date: ${currentDate}`, 56, dateY);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = 'Kudimata_LMS_Certificate.png';
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png', 1.0);

    } catch (err) {
      setError('Failed to generate certificate image. Try again or use a desktop browser.');
      console.error('Certificate image error:', err);
    }
  };

  const downloadAsPDF = async () => {
    if (!certificateRef.current || !imageLoaded) return;
    
    try {
      // Create PDF with exact certificate dimensions
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [940, 695]
      });

      // Load the background image
      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        bgImage.onload = resolve;
        bgImage.onerror = reject;
        bgImage.src = certificateImage;
      });

      // Create a high-resolution canvas for the background
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const scale = 2;
      canvas.width = 940 * scale;
      canvas.height = 695 * scale;
      ctx.scale(scale, scale);

      // Draw the background image
      ctx.drawImage(bgImage, 0, 0, 940, 695);

      // Convert canvas to data URL and add to PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, 940, 695);

      // Add course title ~120px above user name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(36);
      pdf.setTextColor('#000000');
      const courseTitle = certificateCourseTitle || '[DEBUG: No course title set]';
      const courseTitleY = 695 * 0.63 - 110;
      pdf.text(courseTitle, 50, courseTitleY);

      // Add user name with precise positioning - synced with JSX (57% of 695px ≈ 396px)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(58);
      pdf.setTextColor('#000000');
      const nameY = 695 * 0.63; // 57% from top
      pdf.text(`${user?.firstname} ${user?.lastname}`, 50, nameY);

      // Add date with precise positioning - synced with JSX (67% of 695px ≈ 465px)
      pdf.setFontSize(14);
      const dateY = 695 * 0.70; // 67% from top
      const currentDate = new Date().getDate() + '/' + (new Date().getMonth() + 1) + '/' + new Date().getFullYear();
      pdf.text(`Date: ${currentDate}`, 56, dateY);

      pdf.save('Kudimata_LMS_Certificate.pdf');

    } catch (err) {
      setError('Failed to generate certificate PDF. Try again or use a desktop browser.');
      console.error('Certificate PDF error:', err);
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
      <div className="max-w-5xl w-full bg-white p-6 rounded-lg shadow-lg text-center">
        {error && (
          <div className='mb-4'>
            <AlertMessage message={error} open={!!error} onClose={() => setError(null)} />
          </div>
        )}
        {canAccess ? (
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-bold">Congratulations, {user?.firstname}!</h1>
            <p className="text-gray-600">Your certificate is ready. You can download it below.</p>
            
            {/* Certificate Display */}
            <div 
              ref={certificateRef} 
              className="relative border shadow-lg"
              style={{ 
                width: '940px',
                height: '695px',
              }}
            >
              {/* Background Certificate Image */}
              <img 
                src={certificateImage}
                alt="Certificate Background"
                className="absolute inset-0 w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
                onError={() => setError('Failed to load certificate background image')}
                style={{
                  imageRendering: '-webkit-optimize-contrast',
                }}
              />
              
              {/* Overlay Content */}
              <div className="absolute inset-0">
                {/* Course Title (debug/visible) */}
                <div
                  className="absolute font-bold text-black"
                  style={{
                    fontSize: '30px',
                    left: '50px',
                    top: 'calc(57% - 110px)',
                  }}
                >
                  {certificateCourseTitle || '[DEBUG: No course title set]'}
                </div>
                {/* User Name */}
                <div
                  className="absolute font-bold text-black"
                  style={{
                    fontSize: '48px',
                    left: '50px',
                    top: '57%',
                  }}
                >
                  {`${user?.firstname} ${user?.lastname}`}
                </div>
                {/* Date */}
                <div
                  className="absolute font-bold text-black"
                  style={{
                    fontSize: '13px',
                    left: '56px',
                    top: '67%',
                  }}
                >
                  Date: {new Date().getDate() + '/' + (new Date().getMonth() + 1) + '/' + new Date().getFullYear()}
                </div>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex gap-4 mt-4">
              <button
                onClick={downloadAsImage}
                disabled={!imageLoaded}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
              >
                Download High-Res Image
              </button>
              <button
                onClick={downloadAsPDF}
                disabled={!imageLoaded}
                className="bg-[#FFD600] hover:bg-[#FFB800] disabled:bg-gray-400 text-black font-bold py-3 px-6 rounded-lg transition duration-300"
              >
                Download Print-Ready PDF
              </button>
            </div>
            
            {!imageLoaded && (
              <p className="text-sm text-gray-500">Loading certificate template...</p>
            )}
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