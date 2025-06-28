import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import AlertMessage from '../../../components/AlertMessage';
import certificateImage from '../../../assets/cert.png';

const CertificateDownloadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canAccess, setCanAccess] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // const canAccessCert = localStorage.getItem('can_access_certificate');
    const canAccessCert = 'true';
    if (canAccessCert === 'true') {
      setCanAccess(true);
      localStorage.removeItem('can_access_certificate');
    } else {
      setError('You do not have permission to view this page. Please complete the payment or enter a valid code.');
    }
    setLoading(false);
  }, []);

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
      const height = 595;
      
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

      // Set text properties
      ctx.fillStyle = '#1f2937';
      ctx.textBaseline = 'top';

      // Draw user name
      ctx.fillText(`${user?.firstname} ${user?.lastname}`, 60, 200);

      // Draw date
      const currentDate = new Date().getDate() + '/' + (new Date().getMonth() + 1) + '/' + new Date().getFullYear();
      ctx.fillText(currentDate, 82, 360);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = 'Kudimata_Certificate.png';
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
        format: [940, 595]
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
      canvas.height = 595 * scale;
      ctx.scale(scale, scale);

      // Draw the background image
      ctx.drawImage(bgImage, 0, 0, 940, 595);

      // Convert canvas to data URL and add to PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, 940, 595);

      // Add text with precise positioning
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(48);
      pdf.setTextColor(31, 41, 55); // #1f2937
      pdf.text(`${user?.firstname} ${user?.lastname}`, 60, 230); // Adjusted Y for PDF coordinate system

      pdf.setFontSize(12);
      const currentDate = new Date().getDate() + '/' + (new Date().getMonth() + 1) + '/' + new Date().getFullYear();
      pdf.text(currentDate, 82, 368); // Adjusted Y for PDF coordinate system

      pdf.save('Kudimata_Certificate.pdf');

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
                height: '595px',
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
                {/* User Name */}
                <div
                  className="absolute font-bold text-gray-900"
                  style={{
                    fontSize: '48px',
                    left: '55px',
                    top: '180px',
                  }}
                >
                  {`${user?.firstname} ${user?.lastname}`}
                </div>
                
                {/* Date */}
                <div
                  className="absolute font-bold text-gray-900"
                  style={{
                    fontSize: '11px',
                    left: '82px',
                    top: '358px',
                  }}
                >
                  {new Date().getDate() + '/' + (new Date().getMonth() + 1) + '/' + new Date().getFullYear()}
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
              onClick={() => navigate('/super-quiz/certificate')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              Back to Certificate Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateDownloadPage;