import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ContentCard from '../HomePage/HomePageComponents/ContentCard';
import {
  CloseSVG,
  ForwardArrowSVG,
} from '../../assets/icons/icons';
import RightSideBar from '../../components/RightSideBar/RightSideBar';
import UserCard from '../HomePage/HomePageComponents/UserCard';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { usePostUpdate } from '../../context/PostUpdateContext/PostUpdateContext';

interface ProfileData {
  name: string;
  date_joined: string;
  bio: string | null;
  followers: number;
  following: number;
  posts: number;
  iam_following: boolean;
}

interface User {
  id: string;
  firstname: string;
  lastname: string;
  bio: string | null;
  iam_following: boolean;
  profile_picture: string;
}

interface FollowData {
  id: number;
  user_id: number;
  follow_id: number;
  user: {
    id: number;
    firstname: string;
    lastname: string;
    active_subscription: boolean;
    profile_picture: string;
    is_consultant_profile: boolean;
    is_an_admin: boolean;
    group_admin_data: any;
    is_active: boolean;
    bio?: string | null;
  };
}

interface Post {
  id: number;
  user_id: string;
  topic_id: number;
  content: string;
  video: string | null;
  updated_at: string;
  type: number;
  image_urls: string[];
  liked: boolean;
  saved: boolean;
  likes_count: number;
  comments_count: number;
  topic: {
    id: number;
    name: string;
    logo: string;
  };
  user: {
    id: number;
    firstname: string;
    lastname: string;
    active_subscription: boolean;
    profile_picture: string;
    is_consultant_profile: boolean;
    is_an_admin: boolean;
    group_admin_data: any;
  };
}

const OtherUsersProfilePage = () => {
  const { apiClient, user: authUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shouldRefresh } = usePostUpdate();

  const [isFollowingOpen, setFollowingOpen] = useState(false);
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Fetch profile data and initialize follow state
  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) {
        console.log(followerCount);
        alert('Invalid user ID');
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get(`/profile/${id}`);
        console.log('GET /profile/${id} response:', JSON.stringify(response.data, null, 2));
        const profileData = response.data.data;
        setProfile(profileData);
        setIsFollowed(profileData.iam_following);
        setFollowerCount(profileData.followers);
        
      } catch (error: any) {
        console.error('Profile fetch error:', error.response?.data || error.message);
        alert('Failed to load profile');
      }
    };

    fetchProfile();
  }, [id, apiClient]);

  // Fetch posts (combined both useEffect hooks)
  useEffect(() => {
    const fetchPosts = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await apiClient.get('/posts');
        console.log('GET /posts response:', JSON.stringify(response.data, null, 2));
        const userPosts = response.data.filter((post: Post) => post.user_id.toString() === id.toString());
        setPosts(userPosts);
      } catch (error: any) {
        console.error('Posts fetch error:', error.response?.data || error.message);
        alert('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [id, apiClient, shouldRefresh]);

  // Fetch followers when popup opens
  useEffect(() => {
    const fetchFollowers = async () => {
      if (!id) return;

      try {
        setFollowersLoading(true);
        const response = await apiClient.get(`/profile/followers/${id}`);
        console.log('GET /profile/followers/${id} response:', JSON.stringify(response.data, null, 2));
        const followersData: FollowData[] = response.data;
        const mappedFollowers: User[] = followersData.map((f) => ({
          id: f.user.id.toString(),
          firstname: f.user.firstname,
          lastname: f.user.lastname,
          bio: f.user.bio || null,
          iam_following: f.user.is_active, // Assuming `is_active` indicates if you're following them; adjust if there's a better field
          profile_picture: f.user.profile_picture,
        }));
        setFollowers(mappedFollowers);
      } catch (error: any) {
        console.error('Followers fetch error:', error.response?.data || error.message);
        alert('Failed to load followers');
      } finally {
        setFollowersLoading(false);
      }
    };

    if (isFollowersOpen) {
      fetchFollowers();
    }
  }, [isFollowersOpen, id, apiClient]);

  // Fetch following when popup opens
  useEffect(() => {
    const fetchFollowing = async () => {
      if (!id) return;

      try {
        setFollowingLoading(true);
        const response = await apiClient.get(`/profile/following/${id}`);
        console.log('GET /profile/following/${id} response:', JSON.stringify(response.data, null, 2));
        const followingData: FollowData[] = response.data;
        const mappedFollowing: User[] = followingData.map((f) => ({
          id: f.user.id.toString(),
          firstname: f.user.firstname,
          lastname: f.user.lastname,
          bio: f.user.bio || null,
          iam_following: f.user.is_active, // Adjust if there's a better field for `iam_following`
          profile_picture: f.user.profile_picture,
        }));
        setFollowing(mappedFollowing);
      } catch (error: any) {
        console.error('Following fetch error:', error.response?.data || error.message);
        alert('Failed to load following');
      } finally {
        setFollowingLoading(false);
      }
    };

    if (isFollowingOpen) {
      fetchFollowing();
    }
  }, [isFollowingOpen, id, apiClient]);

  // Follow/Unfollow user
  const toggleFollow = async () => {
    if (!authUser || !authUser.id) {
      navigate('/login');
      return;
    }
    if (id === authUser.id.toString()) {
      return; // Prevent following yourself
    }
    if (isFollowingLoading) return;

    try {
      setIsFollowingLoading(true);
      const response = await apiClient.post(`/profile/follow/${id}`);
      console.log('POST /profile/follow/${id} response:', JSON.stringify(response.data, null, 2));
      const { status } = response.data;

      if (status) {
        setIsFollowed(true);
        setFollowerCount((prev) => prev + 1);
        setProfile((prev) => (prev ? { ...prev, iam_following: true, followers: prev.followers + 1 } : null));
      } else {
        setIsFollowed(false);
        setFollowerCount((prev) => prev - 1);
        setProfile((prev) => (prev ? { ...prev, iam_following: false, followers: prev.followers - 1 } : null));
      }
    } catch (err: any) {
      console.error('Follow error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to follow/unfollow user. Please try again.');
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleEnrollClick = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="loader" />
      </div>
    );
  }

  if (!profile) {
    return <div className="flex items-center justify-center h-full text-sm font-bold">Profile not found</div>;
  }

  return (
    <div className="w-full flex h-full">
      <div className="w-full h-full flex-[4] overflow-x-hidden overflow-y-scroll flex flex-col gap-2">
        <div
          onClick={handleEnrollClick}
          className="cursor-pointer mx-10 mt-10 w-10 min-h-10 rotate-180 mb-5 bg-gray-300 rounded-full flex items-center justify-center"
        >
          <ForwardArrowSVG size={13} />
        </div>
        <div className="profile px-10 max-sm:px-4 max-sm:flex-col border-b border-b-gray-200 pb-10 flex gap-2">
          <div className="left w-20 min-w-20 bg-gray-300 h-20 rounded-full"></div>
          <div className="right flex flex-col p-2 gap-2 pr-4">
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="text-xs">{profile.bio || 'No bio available'}</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center relative gap-1">
                {isFollowersOpen && (
                  <div className="w-80 p-8 flex flex-col gap-2 absolute bottom-[-250px] z-8 left-0 rounded-xl bg-white border border-gray-200 h-80">
                    <div className="w-full items-center justify-between flex">
                      <h1 className="font-bold">Followers</h1>
                      <div className="cursor-pointer" onClick={() => setIsFollowersOpen(false)}>
                        <CloseSVG size={15} />
                      </div>
                    </div>
                    <div className="overflow-y-scroll h-full w-full">
                      {followersLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="loader" />
                        </div>
                      ) : followers.length > 0 ? (
                        followers.map((user) => (
                          <UserCard
                            key={user.id}
                            id={user.id}
                            profile_picture={user.profile_picture}
                            name={`${user.firstname} ${user.lastname}`}
                            bio={user.bio}
                            iam_following={user.iam_following}
                          />
                        ))
                      ) : (
                        <p className="text-xs">No followers</p>
                      )}
                    </div>
                  </div>
                )}
                <h2 className="font-bold text-sm">{profile.followers}</h2>
                <p
                  className="text-[10px] cursor-pointer text-[#68049B]"
                  onClick={() => setIsFollowersOpen(!isFollowersOpen)}
                >
                  Followers
                </p>
              </div>
              <div className="flex items-center relative gap-1">
                {isFollowingOpen && (
                  <div className="w-80 p-8 flex flex-col gap-2 absolute bottom-[-250px] z-8 left-0 rounded-xl bg-white border border-gray-200 h-80">
                    <div className="w-full items-center justify-between flex">
                      <h1 className="font-bold">Following</h1>
                      <div className="cursor-pointer" onClick={() => setFollowingOpen(false)}>
                        <CloseSVG size={15} />
                      </div>
                    </div>
                    <div className="overflow-y-scroll h-full w-full">
                      {followingLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="loader" />
                        </div>
                      ) : following.length > 0 ? (
                        following.map((user, index) => (
                          <UserCard
                            key={index}
                            id={user.id}
                            profile_picture={user.profile_picture}
                            name={`${user.firstname} ${user.lastname}`}
                            bio={user.bio}
                            iam_following={user.iam_following}
                          />
                        ))
                      ) : (
                        <p className="text-xs">Not following anyone</p>
                      )}
                    </div>
                  </div>
                )}
                <h2 className="font-bold text-sm">{profile.following}</h2>
                <p
                  className="text-[10px] cursor-pointer text-[#68049B]"
                  onClick={() => setFollowingOpen(!isFollowingOpen)}
                >
                  Following
                </p>
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="flex items-center px-8 py-1 bg-gray-200 rounded-md gap-2 justify-center">
                <button
                  onClick={toggleFollow}
                  className={`cursor-pointer text-gray-700 text-sm font-bold ${
                    isFollowingLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={isFollowingLoading}
                >
                  {isFollowingLoading ? (
                    <span className="loader w-full"></span>
                  ) : isFollowed ? (
                    'Unfollow'
                  ) : (
                    'Follow'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="p-10 max-sm:p-4 flex flex-col gap-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <ContentCard
                key={post.id}
                id={post.id.toString()}
                userId={post.user_id.toString()}
                title={post.topic.name}
                description={post.content}
                image={post.image_urls[0] || null}
                likes={post.likes_count}
                comments={post.comments_count}
                author={`${post.user.firstname} ${post.user.lastname}`}
                institution={post.topic.name}
                time={post.updated_at}
                isSingleUser={false}
                profilePicture={post.user.profile_picture}
              />
            ))
          ) : (
            <p className="text-xs text-center">No posts available</p>
          )}
        </div>
      </div>
      <div className="overflow-y-scroll max-sm:hidden flex-[3]">
        <RightSideBar />
      </div>
    </div>
  );
};

export default OtherUsersProfilePage;