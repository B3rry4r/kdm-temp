import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentCard from '../HomePage/HomePageComponents/ContentCard';
import {
  CloseSVG,
  EditSVG,
  ForwardArrowSVG,
  ShareSVG,
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
  name: string;
  bio: string | null;
  iam_following: boolean;
  profile_picture: string;
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

const ProfilePage = () => {
  const { user, apiClient } = useAuth();
  const id = user?.id;
  const navigate = useNavigate();
  const [isFollowingOpen, setFollowingOpen] = useState(false);
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
    const { shouldRefresh } = usePostUpdate();
  

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get(`/profile/${id}`);
        console.log('Profile response:', response.data);
        setProfile(response.data.data);
      } catch (error: any) {
        console.error('Profile fetch error:', error.response?.data || error.message);
        alert('Failed to load profile');
      }
    };
    if (id) {
      fetchProfile();
    }
  }, [id, apiClient]);

  useEffect(() => {
    if (shouldRefresh) {
      setLoading(true);
      // setPosts([]);
      const fetchPosts = async () => {
        try {
          const response = await apiClient.get('/posts');
          const userPosts = response.data.filter((post: Post) => post.user_id === id);
          
          setPosts(userPosts);
          setLoading(false);
        } catch (error: any) {
          alert('Failed to load posts');
          setLoading(false);
        }
      };
    fetchPosts();
    }
  }, [shouldRefresh]);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await apiClient.get('/posts');
        console.log('Posts response:', response.data);
        const userPosts = response.data.filter((post: Post) => post.user_id === id);
        console.log(userPosts);
        
        setPosts(userPosts);
        setLoading(false);
      } catch (error: any) {
        console.error('Posts fetch error:', error.response?.data || error.message);
        alert('Failed to load posts');
        setLoading(false);
      }
    };
    if (id) {
      fetchPosts();
    }
  }, [id, apiClient]);

  // Fetch followers when popup opens
  useEffect(() => {
    if (isFollowersOpen && id) {
      const fetchFollowers = async () => {
        try {
          const response = await apiClient.get(`/profile/followers/${id}`);
          console.log('Followers response:', response.data);
          const followersData = response.data.map((f: any) => ({
            id: f.id.toString(),
            // name: `${f.user.firstname} ${f.user.lastname}`,
            bio: f.user.bio || null,
            iam_following: f.iam_following,
          }));
          setFollowers(followersData);
        } catch (error: any) {
          console.error('Followers fetch error:', error.response?.data || error.message);
          alert('Failed to load followers');
        }
      };
      fetchFollowers();
    }
  }, [isFollowersOpen, id, apiClient]);

  // Fetch following when popup opens
  useEffect(() => {
    if (isFollowingOpen && id) {
      const fetchFollowing = async () => {
        try {
          const response = await apiClient.get(`/profile/following/${id}`);
          console.log('Following response:', response.data);
          const followingData = response.data.map((f: any) => ({
            id: f.user.id.toString(),
            name: `${f.user.firstname} ${f.user.lastname}`,
            bio: f.user.bio || null,
            iam_following: f.iam_following,
            profile_picture: f.profile_picture,
          }));
          setFollowing(followingData);
        } catch (error: any) {
          console.error('Following fetch error:', error.response?.data || error.message);
          alert('Failed to load following');
        }
      };
      fetchFollowing();
    }
  }, [isFollowingOpen, id, apiClient]);

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
                {isFollowersOpen ? (
                  <div className="w-80 p-8 flex flex-col gap-2 absolute bottom-[-250px] z-8 left-0 rounded-xl bg-white border border-gray-200 h-80">
                    <div className="w-full items-center justify-between flex">
                      <h1 className="font-bold">Followers</h1>
                      <div className="cursor-pointer" 
                      onClick={() => setIsFollowersOpen(false)}
                      >
                        <CloseSVG size={15} />
                      </div>
                    </div>
                    <div className="overflow-y-scroll h-full w-full">
                      {followers.length > 0 ? (
                        followers.map((user) => (
                          <UserCard
                            key={user.id}
                            id={user.id}
                            name={user.name}
                            bio={user.bio}
                            iam_following={user.iam_following}
                            profile_picture={user.profile_picture}
                          />
                        ))
                      ) : (
                        <p className="text-xs">No followers</p>
                      )}
                    </div>
                  </div>
                ) : null}
                <h2 className="font-bold text-sm">{profile.followers}</h2>
                <p
                  className="text-[10px] cursor-pointer text-[#68049B]"
                  onClick={() => setIsFollowersOpen(!isFollowersOpen)}
                >
                  Followers
                </p>
              </div>
              <div className="flex items-center relative gap-1">
                {isFollowingOpen ? (
                  <div className="w-80 p-8 flex flex-col gap-2 absolute bottom-[-250px] z-8 left-0 rounded-xl bg-white border border-gray-200 h-80">
                    <div className="w-full items-center justify-between flex">
                      <h1 className="font-bold">Following</h1>
                      <div className="cursor-pointer" onClick={() => setFollowingOpen(false)}>
                        <CloseSVG size={15} />
                      </div>
                    </div>
                    <div className="overflow-y-scroll h-full w-full">
                      {following.length > 0 ? (
                        following.map((user) => (
                          <UserCard
                            key={user.id}
                            id={user.id}
                            name={user.name}
                            bio={user.bio}
                            iam_following={user.iam_following}
                            profile_picture={user.profile_picture}
                          />
                        ))
                      ) : (
                        <p className="text-xs">Not following anyone</p>
                      )}
                    </div>
                  </div>
                ) : null}
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
              <div className="flex items-center px-8 py-1 bg-gray-200 cursor-default rounded-md gap-2 justify-center">
                <EditSVG size={12} />
                <button className="cursor-pointer text-gray-700 text-sm font-bold">Edit Profile</button>
              </div>
              <ShareSVG size={12} />
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
                isCommentScreen={true}
                isSingleUser={true}
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

export default ProfilePage;