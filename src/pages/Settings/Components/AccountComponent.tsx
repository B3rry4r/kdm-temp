import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import imageCompression from 'browser-image-compression';
import AlertMessage from '../../../components/AlertMessage';


// Define user type
interface User {
  id: number;
  firstname: string;
  lastname: string;
  phone: string;
  country: string;
  profession: string;
  gender: string;
  bio: string;
  profile_picture: string | null;
}

// Form state type for editable fields
interface FormState {
  phone_number: string;
  profession: string;
  bio: string;
  profile_picture: File | null;
}

const AccountComponent = () => {
  const { apiClient } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>({
    phone_number: '',
    profession: '',
    bio: '',
    profile_picture: null,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

// Add cleanup in handleImageChange and useEffect
const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      // Revoke previous preview URL if it exists
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }

      setForm((prev) => ({ ...prev, profile_picture: compressedFile }));
      const previewUrl = URL.createObjectURL(compressedFile);
      setPreviewImage(previewUrl);
    } catch (error) {
      console.error('Image compression error:', error);
    }
  }
};

// Clean up preview URL on component unmount
useEffect(() => {
  return () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
  };
}, [previewImage]);
  // Fetch user data from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);
      setForm({
        phone_number: parsedUser.phone || '',
        profession: parsedUser.profession || '',
        bio: parsedUser.bio || '',
        profile_picture: null,
      });
      if (parsedUser.profile_picture) {
        setPreviewImage(parsedUser.profile_picture);
      }
    } else {
    }
  }, []);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle phone number change
  const handlePhoneChange = (value: string) => {
    setForm((prev) => ({ ...prev, phone_number: value }));
  };

// Handle profile update
const handleSave = async () => {
  if (!user) return;

  setLoading(true);

  try {
    const formData = new FormData();
    // Only append fields that have changed
    if (form.phone_number && form.phone_number !== user.phone) {
      formData.append('phone', form.phone_number);
    }
    if (form.profession && form.profession !== user.profession) {
      formData.append('profession', form.profession);
    }
    if (form.bio && form.bio !== user.bio) {
      formData.append('bio', form.bio);
    }
    if (form.profile_picture) {
      formData.append('image', form.profile_picture);
    }

    // Check if there's anything to update
    const hasChanges = Array.from(formData.entries()).length > 0;
    if (!hasChanges) {
      setLoading(false);
      return;
    }

    const response = await apiClient.post(`/account/profile`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Extract updated user data from response
    const responseData = response.data.data; // Access the 'data' object from response

    // Create updated user object by merging existing user with new data
    const updatedUser: User = {
      ...user,
      phone: responseData.phone || user.phone,
      profession: responseData.profession || user.profession,
      bio: responseData.bio || user.bio,
      profile_picture: responseData.profile_picture || user.profile_picture,
    };

    // Update form state to reflect the new values
    setForm((prev) => ({
      ...prev,
      phone_number: responseData.phone || prev.phone_number,
      profession: responseData.profession || prev.profession,
      bio: responseData.bio || prev.bio,
      profile_picture: null, // Reset file input after upload
    }));

    // Update preview image if profile picture changed
    if (responseData.profile_picture) {
      setPreviewImage(responseData.profile_picture);
    }

    // Save updated user to localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));

    // Update user state
    setUser(updatedUser);

    setAlertMsg('Profile updated successfully');
    setAlertOpen(true);
  } catch (err: any) {
    setAlertMsg(err.response?.data?.message || 'Failed to update profile');
    setAlertOpen(true);
  } finally {
    setLoading(false);
  }
};

  // Handle account deactivation
  const handleDeactivate = async () => {
    if (!user) return;

    setLoading(true);

    try {
      await apiClient.put(`/account/deactivate`);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err: any) {
      setAlertMsg(err.response?.data?.message || 'Failed to deactivate account');
      setAlertOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-red-500 w-full h-full flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="w-80 max-sm:w-full flex flex-col mt-3 gap-3">
      <div className="pb-8 border-b flex flex-col gap-3 border-gray-300">
        <h1 className="font-bold text-xl">Account Information</h1>
        <div className="w-72 flex flex-col gap-3 justify-end items-end">
          <div className="flex w-full flex-col gap-2">
            <label className="text-xs mb-1">Full Name</label>
            <input
              type="text"
              value={`${user.firstname || ''} ${user.lastname || ''}`.trim()}
              className="w-full p-2 outline-none border-none bg-gray-100 font-bold rounded text-sm text-gray-500"
              disabled
            />
          </div>
          <div className="flex w-full flex-col gap-2">
            <p className="text-sm">Phone Number</p>
            <PhoneInput
              country={'ng'}
              value={form.phone_number}
              onChange={handlePhoneChange}
              inputClass="w-full p-2 outline-none border-none bg-white font-bold rounded text-sm"
              containerClass="w-full"
              buttonStyle={{ background: 'white', border: 'none', outline: 'none' }}
              inputStyle={{ height: '36px', width: '100%' }}
            />
          </div>
        </div>
      </div>
      <div className="pb-8 border-b mt-8 flex flex-col gap-3 border-gray-300">
        <h1 className="font-bold text-xl">Profile Information</h1>
        <div className="w-72 flex flex-col gap-3 justify-end items-end">
          <div className="w-full flex my-4 items-center gap-5">
            <div className="w-18 h-18 rounded-full bg-gray-200">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200" />
              )}
            </div>
            <label className="p-2 bg-gray-200 rounded-lg text-xs font-semibold cursor-pointer">
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex w-full flex-col gap-2">
            <label className="text-xs mb-1">Full Name</label>
            <input
              type="text"
              value={`${user.firstname || ''} ${user.lastname || ''}`.trim()}
              className="w-full p-2 outline-none border-none bg-gray-100 font-bold rounded text-sm text-gray-500"
              disabled
            />
          </div>
          <div className="flex w-full flex-col gap-2">
            <label className="text-xs mb-1 block">Country</label>
            <select
              value={user.country || ''}
              className="w-full p-2 outline-none border-none bg-gray-100 font-semibold text-gray-500 rounded text-sm"
              disabled
            >
              <option value={user.country || ''} className="text-xs">
                {user.country || 'Not set'}
              </option>
            </select>
          </div>
          <div className="flex w-full flex-col gap-2">
            <label className="text-xs mb-1">Profession</label>
            <input
              type="text"
              name="profession"
              value={form.profession}
              onChange={handleInputChange}
              placeholder="Enter profession"
              className="w-full p-2 outline-none border-none bg-white font-bold rounded text-sm"
            />
          </div>
          <div className="flex w-full flex-col gap-2">
            <label className="text-xs mb-1 block">Gender</label>
            <select
              value={user.gender || ''}
              className="w-full p-2 outline-none border-none bg-gray-100 font-semibold text-gray-500 rounded text-sm"
              disabled
            >
              <option value={user.gender || ''} className="text-xs">
                {user.gender || 'Not set'}
              </option>
            </select>
          </div>
          <div className="flex w-full flex-col gap-2">
            <label className="text-xs mb-1 block">Short Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleInputChange}
              className="w-full h-[100px] rounded-sm p-2 resize-none bg-white text-sm outline-none"
              placeholder="Tell us about yourself"
            />
          </div>

          <button
            onClick={handleSave}
            className="border-none mt-4 bg-gray-300 text-xs w-15 p-2 rounded-sm text-gray-500 font-bold disabled:opacity-50 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? <div className="loader"></div> : 'Save'}
          </button>
        </div>
      </div>
      <p
        onClick={handleDeactivate}
        className="text-red-500 font-bold text-xs cursor-pointer"
      >
        Deactivate Account
      </p>
      <AlertMessage open={alertOpen} message={alertMsg} severity="purple" onClose={() => setAlertOpen(false)} />
    </div>
  );
};

export default AccountComponent;