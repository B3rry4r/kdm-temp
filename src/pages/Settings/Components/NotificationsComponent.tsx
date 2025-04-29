import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';

// Interface for account activity settings
interface AccountActivitySettings {
  follows_me: number;
  likes_my_comment: number;
  likes_my_post: number;
  mentions_me: number;
}

const NotificationsComponent = () => {
  const { apiClient } = useAuth();
  const [form, setForm] = useState<AccountActivitySettings>({
    follows_me: 0,
    likes_my_comment: 0,
    likes_my_post: 0,
    mentions_me: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch initial account activity settings
  useEffect(() => {
    const fetchAccountActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<AccountActivitySettings>('/account/activity');
        console.log('GET /account/activity response:', JSON.stringify(response.data, null, 2));
        setForm({
          follows_me: response.data.follows_me,
          likes_my_comment: response.data.likes_my_comment,
          likes_my_post: response.data.likes_my_post,
          mentions_me: response.data.mentions_me,
        });
      } catch (err: any) {
        console.error('Error fetching account activity:', err.response?.data || err.message);
        setError('Failed to load account activity settings');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountActivity();
  }, [apiClient]);

  // Handle checkbox changes
  const handleCheckboxChange = (key: keyof AccountActivitySettings) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key] === 1 ? 0 : 1,
    }));
  };

  // Handle form submission
  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload = {
        follows_me: form.follows_me,
        likes_my_comment: form.likes_my_comment,
        likes_my_post: form.likes_my_post,
        mentions_me: form.mentions_me,
      };
      const response = await apiClient.post('/account/activity', payload);
      console.log('POST /account/activity response:', JSON.stringify(response.data, null, 2));
      alert('Preferences saved successfully');
    } catch (err: any) {
      console.error('Error saving account activity:', err.response?.data || err.message);
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="loader"></div>
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
    <div className="w-100 max-sm:w-full flex flex-col mt-3 gap-3">
      <h1 className="font-bold text-xl">Account Activity</h1>
      <p className="text-sm mb-4 mt-2 font-bold">Email me when:</p>
      <div className="flex items-start w-full justify-between mb-4">
        <label htmlFor="follows_me" className="ml-2 text-xs">
          Someone follows me
        </label>
        <input
          type="checkbox"
          id="follows_me"
          checked={form.follows_me === 1}
          onChange={() => handleCheckboxChange('follows_me')}
          className="h-4 w-4 text-[#68049B] outline-none border-none bg-gray-200 rounded"
        />
      </div>
      <div className="flex items-start w-full justify-between mb-4">
        <label htmlFor="likes_my_comment" className="ml-2 text-xs">
          Someone likes my comment
        </label>
        <input
          type="checkbox"
          id="likes_my_comment"
          checked={form.likes_my_comment === 1}
          onChange={() => handleCheckboxChange('likes_my_comment')}
          className="h-4 w-4 text-[#68049B] outline-none border-none bg-gray-200 rounded"
        />
      </div>
      <div className="flex items-start w-full justify-between mb-4">
        <label htmlFor="likes_my_post" className="ml-2 text-xs">
          Someone likes my post
        </label>
        <input
          type="checkbox"
          id="likes_my_post"
          checked={form.likes_my_post === 1}
          onChange={() => handleCheckboxChange('likes_my_post')}
          className="h-4 w-4 text-[#68049B] outline-none border-none bg-gray-200 rounded"
        />
      </div>
      <div className="flex items-start w-full justify-between mb-4">
        <label htmlFor="mentions_me" className="ml-2 text-xs">
          Someone mentions me
        </label>
        <input
          type="checkbox"
          id="mentions_me"
          checked={form.mentions_me === 1}
          onChange={() => handleCheckboxChange('mentions_me')}
          className="h-4 w-4 text-[#68049B] outline-none border-none bg-gray-200 rounded"
        />
      </div>
      <div>
        <h1 className="font-bold text-xl mb-3 mt-7">Newsletter</h1>
        <p className="text-xs">Keep in touch with the latest Kudimata news.</p>
        <p className="text-xs">including new features and upcoming events</p>
      </div>
      <button
        onClick={handleSavePreferences}
        disabled={saving}
        className={`border-none bg-[#FFD30F] text-xs w-40 p-3 rounded-sm mt-8 font-bold ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
};

export default NotificationsComponent;