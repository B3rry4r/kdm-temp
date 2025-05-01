import { useState, useEffect } from 'react';
import { CopyLinkSVG } from '../../assets/icons/icons';
import { useAuth } from '../../context/AuthContext/AuthContext';
import AlertMessage from '../../components/AlertMessage';

interface ReferralData {
  id: number;
  user_id: number;
  referral_code: string;
  referral_count: number;
  referral_points: number;
}

const ReferPage = () => {
  const { apiClient } = useAuth();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  // Fetch referral data
  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<ReferralData>('/account/referral');
        console.log('GET /account/referral response:', JSON.stringify(response.data, null, 2));
        setReferralData(response.data);
      } catch (err: any) {
        console.error('Error fetching referral data:', err.response?.data || err.message);
        setError('Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [apiClient]);

  // Handle copy to clipboard
  const handleCopyCode = () => {
    if (!referralData?.referral_code) return;

    navigator.clipboard.writeText(referralData.referral_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }).catch((err) => {
      console.error('Failed to copy referral code:', err);
      setAlertMsg('Failed to copy referral code');
      setAlertOpen(true);
    });
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  if (error || !referralData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-red-500 text-sm">{error || 'Referral data not found'}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-scroll flex-col flex gap-3 p-10">
      <h1 className="font-bold text-3xl mb-2">Refer Friends</h1>
      <div>
        <p className="text-sm text-gray-700">Earn points anytime a friend</p>
        <p className="text-sm text-gray-700">signs up with your code</p>
      </div>
      <div className="flex gap-2 h-auto max-sm:w-full w-100">
        <div className="bg-white w-full h-full max-sm:p-6 p-8 rounded-2xl">
          <p className="font-bold mb-4 max-sm:text-3xl text-4xl text-[#68049B]">{referralData.referral_count}</p>
          <p className="text-sm max-sm:text-xs text-gray-700">Referral Count</p>
        </div>
        <div className="bg-white w-full h-full max-sm:p-6 p-8 rounded-2xl">
          <p className="font-bold mb-4 max-sm:text-3xl text-4xl text-[#68049B]">{referralData.referral_points}</p>
          <p className="text-sm max-sm:text-xs text-gray-700">Points Earned</p>
        </div>
      </div>
      <div className="w-100 max-sm:w-full items-center flex flex-col p-8 gap-2 justify-center bg-[#68049B] h-auto rounded-2xl">
        <p className="font-bold max-sm:text-sm text-white">Share your code with friends</p>
        <div
          onClick={handleCopyCode}
          className="w-full p-4 bg-white cursor-pointer flex items-center rounded-xl justify-between"
        >
          <p className="font-bold max-sm:text-sm">{referralData.referral_code}</p>
          <CopyLinkSVG size={20} />
        </div>
        {copied && (
          <p className="text-xs text-white mt-2">Referral code copied!</p>
        )}
      </div>
      <AlertMessage open={alertOpen} message={alertMsg} severity="purple" onClose={() => setAlertOpen(false)} />
    </div>
  );
};

export default ReferPage;