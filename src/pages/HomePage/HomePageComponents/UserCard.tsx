import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';

interface UserCardProps {
  id?: string;
  name?: string;
  bio?: string | null;
  iam_following?: boolean;
  profile_picture?: string;
}

const UserCard: React.FC<UserCardProps> = ({ id, name, bio, iam_following, profile_picture }) => {
  const { apiClient } = useAuth();
  const [isFollowing, setIsFollowing] = useState(iam_following);
  const [loading, setLoading] = useState(false);

  const handleFollowToggle = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        await apiClient.delete(`/profile/follow/${id}`);
        setIsFollowing(false);
      } else {
        await apiClient.post(`/profile/follow/${id}`);
        setIsFollowing(true);
      }
    } catch (error: any) {
      console.error('Follow toggle error:', error.response?.data || error.message);
      alert('Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-2 flex items-center justify-between">
      <div className="flex gap-2 items-center">
        <div className="w-8 h-8 bg-gray-300 overflow-hidden rounded-full">
          <img src={profile_picture || 'no string'} alt="" className='w-full h-full object-cover' />
        </div>
        <div className="flex w-[130px] flex-col gap-[0px]">
          <p className="text-xs font-bold">{name}</p>
          <p className="text-[10px] overflow-hidden ellipsis whitespace-nowrap">{bio || 'No bio'}</p>
        </div>
      </div>
      <p
        onClick={handleFollowToggle}
        className="py-1 bg-[#FFD30F] px-2 text-xs min-w-[60px] cursor-pointer rounded font-bold disabled:opacity-50"
        style={{ backgroundColor: isFollowing ? '#68049B' : '#FFD30F', color: isFollowing ? '#FFFFFF' : '#000000' }}
      >
        {loading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
      </p>
    </div>
  );
};

export default UserCard;