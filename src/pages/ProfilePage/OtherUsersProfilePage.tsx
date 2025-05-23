import { useState, useEffect, useRef } from 'react';
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

// Interface for profile data
interface ProfileData {
  name: string;
  date_joined: string;
  profile_picture: string;
  bio: string | null;
  followers: number;
  following: number;
  posts: number;
  iam_following: boolean;
}

// Interface for user in followers/following
interface User {
  id: string;
  firstname: string;
  lastname: string;
  bio: string | null;
  iam_following: boolean;
  profile_picture: string;
}

// Interface for follow data
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

// Interface for post
interface Post {
  id: number;
  user_id: number;
  topic_id: number;
  content: string;
  video: string | null;
  updated_at: string;
  type: number | null;
  image_urls: string[];
  liked: boolean;
  saved: boolean;
  likes_count: number;
  comments_count: number;
  topic: {
    id: number;
    name: string;
    logo: string;
    banner: string;
    follower_count: number;
    is_user_following: boolean;
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
    is_active: boolean;
  };
}

// Interface for paginated posts response
interface PaginatedPostsResponse {
  current_page: number;
  data: Post[];
  last_page: number;
  per_page: number;
  total: number;
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch profile data and initialize follow state
  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) {
        console.log(followerCount);
        alert('Invalid user ID');
        return;
      }

      try {
        const response = await apiClient.get(`/profile/${id}`);
        console.log('GET /profile/${id} response:', JSON.stringify(response.data, null, 2));
        const profileData = response.data;
        setProfile(profileData);
        setIsFollowed(profileData.iam_following ? profileData.iam_following : false);
        setFollowerCount(profileData.followers);
      } catch (error: any) {
        console.error('Profile fetch error:', error.response?.data || error.message);
        alert('Failed to load profile');
      }
    };

    fetchProfile();
  }, [id, apiClient]);

  // Fetch posts (initial load)
  useEffect(() => {
    const fetchPosts = async () => {
      if (!id || !hasMore) return;

      try {
        const response = await apiClient.get<PaginatedPostsResponse>('/posts', {
          params: { page, perPage: 10 },
        });
        console.log('GET /posts response:', JSON.stringify(response.data, null, 2));
        const userPosts = response.data.data.filter((post: Post) => post.user_id.toString() === id.toString());
        setPosts((prevPosts) => [...prevPosts, ...userPosts]);
        setHasMore(response.data.current_page < response.data.last_page);
      } catch (error: any) {
        console.error('Posts fetch error:', error.response?.data || error.message);
        alert('Failed to load posts');
      }
    };

    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts();
  }, [id, shouldRefresh, apiClient]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || loading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 2) {
        console.log('Reached bottom, fetching page:', page + 1);
        setPage((prevPage) => prevPage + 1);
      }
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, page]);

  // Fetch posts (scroll-triggered)
  useEffect(() => {
    const fetchPosts = async () => {
      if (!id || !hasMore || page === 1) return;

      try {
        setLoading(true);
        const response = await apiClient.get<PaginatedPostsResponse>(`/posts/user/${id}`, {
          params: { page, perPage: 10 },
        });
        console.log('GET /posts response:', JSON.stringify(response.data, null, 2));
        const userPosts = response.data.data.filter((post: Post) => post.user_id.toString() === id.toString());
        setPosts((prevPosts) => [...prevPosts, ...userPosts]);
        setHasMore(response.data.current_page < response.data.last_page);
      } catch (error: any) {
        console.error('Posts fetch error:', error.response?.data || error.message);
        alert('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page, id, hasMore, apiClient]);

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
          iam_following: f.user.is_active,
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
          iam_following: f.user.is_active,
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


  if (!profile) {
    return (
      <div className="flex w-full h-full items-center justify-center">
      <div className="loader"></div>
    </div>
    )
  }

  return (
    <div className="w-full flex h-full">
      <div
        ref={containerRef}
        className="w-full h-full flex-[4] overflow-x-hidden overflow-y-scroll flex flex-col gap-2"
      >
        <div
          onClick={handleEnrollClick}
          className="cursor-pointer mx-10 mt-10 w-10 min-h-10 rotate-180 mb-5 bg-gray-300 rounded-full flex items-center justify-center"
        >
          <ForwardArrowSVG size={13} />
        </div>
        <div className="profile px-10 max-sm:px-4 max-sm:flex-col border-b border-b-gray-200 pb-10 flex gap-2">
          <div className="left w-20 min-w-20 bg-gray-300 h-20 overflow-hidden rounded-full">
            <img src={profile.profile_picture} alt="" className="w-full h-full object-cover" />
          </div>
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
                <h2 className="font-bold text-sm">{profile.followers.toString()}</h2>
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
                <h2 className="font-bold text-sm">{profile.following.toString()}</h2>
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
            posts.map((post, index) => (
              <ContentCard
                key={index}
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
          {loading && (
            <div className="flex items-center justify-center">
              <div className="loader" />
            </div>
          )}
        </div>
      </div>
      <div className="overflow-y-scroll max-md:flex-[2] max-sm:hidden max-lg:hidden flex-[3]">
        <RightSideBar />
      </div>
    </div>
  );
};

export default OtherUsersProfilePage;