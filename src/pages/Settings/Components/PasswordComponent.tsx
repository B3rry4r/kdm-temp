import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';

const PasswordComponent = () => {
  const { apiClient } = useAuth();
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!form.current_password || !form.new_password) {
      setError('Please fill in both fields');
      setLoading(false);
      return;
    }

    try {
      await apiClient.post('/account/password', {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setSuccess('Password changed successfully');
      setForm({ current_password: '', new_password: '' }); // Reset form
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 max-sm:w-full flex flex-col mt-3 items-end gap-3">
      <div className="flex w-full flex-col gap-2">
        <label className="text-xs mb-1">Old Password</label>
        <input
          type="password"
          name="current_password"
          value={form.current_password}
          onChange={handleInputChange}
          className="w-full p-2 outline-none border-none bg-white font-bold rounded text-sm"
        />
      </div>
      <div className="flex w-full flex-col gap-2">
        <label className="text-xs mb-1">New Password</label>
        <input
          type="password"
          name="new_password"
          value={form.new_password}
          onChange={handleInputChange}
          className="w-full p-2 outline-none border-none bg-white font-bold rounded text-sm"
        />
      </div>
      <button
        onClick={handleChangePassword}
        className="border-none bg-gray-300 text-xs w-15 p-2 rounded-sm text-gray-500 font-bold disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Changing...' : 'Change'}
      </button>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      {success && <p className="text-green-500 text-xs mt-2">{success}</p>}
    </div>
  );
};

export default PasswordComponent;