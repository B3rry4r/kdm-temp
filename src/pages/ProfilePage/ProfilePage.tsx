import { useState, useEffect, useRef } from 'react';
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
import AlertMessage from '../../components/AlertMessage';

// Interface for profile data
interface ProfileData {
  name: string;
  date_joined: string;
  bio: string | null;
  profile_picture: string;
  followers: number;
  following: number;
  posts: number;
  iam_following: boolean;
}

// Interface for user in followers/following
interface User {
  id: string;
  name: string;
  bio: string | null;
  iam_following: boolean;
  profile_picture: string;
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

const ProfilePage = () => {
  const { user, apiClient } = useAuth();
  const id = user?.id;
  const navigate = useNavigate();
  const { refreshKey } = usePostUpdate();

  const [isFollowingOpen, setFollowingOpen] = useState(false);
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get(`/profile/${id}`);
        setProfile(response.data);
      } catch (error: any) {
        setAlertMsg('Could not load your profile. Please try again.');
        setAlertOpen(true);
      }
    };
    if (id) {
      fetchProfile();
    }
  }, [id, apiClient]);

  // Fetch posts (initial load)
  useEffect(() => {
    const fetchPosts = async () => {
      if (!id || !hasMore) return;

      try {
        const response = await apiClient.get<PaginatedPostsResponse>(`/posts/user/${id}`, {
          params: { page, perPage: 10 },
        });
        const userPosts = response.data.data.filter((post: Post) => post.user_id.toString() === id.toString());
        setPosts((prevPosts) => [...prevPosts, ...userPosts]);
        setHasMore(response.data.current_page < response.data.last_page);
      } catch (error: any) {
        setAlertMsg('Failed to load posts');
        setAlertOpen(true);
      }
    };

    if (id) {
      setPosts([]);
      setPage(1);
      setHasMore(true);
      fetchPosts();
    }
  }, [id, refreshKey, apiClient]);

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
        const response = await apiClient.get<PaginatedPostsResponse>('/posts', {
          params: { page, perPage: 10 },
        });
        const userPosts = response.data.data.filter((post: Post) => post.user_id.toString() === id.toString());
        setPosts((prevPosts) => [...prevPosts, ...userPosts]);
        setHasMore(response.data.current_page < response.data.last_page);
      } catch (error: any) {
        setAlertMsg('Failed to load posts');
        setAlertOpen(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPosts();
    }
  }, [page, id, hasMore, apiClient]);

  // Fetch followers when popup opens
  useEffect(() => {
    if (isFollowersOpen && id) {
      const fetchFollowers = async () => {
        try {
          const response = await apiClient.get(`/profile/followers/${id}`);
          const followersData = response.data.map((f: any) => ({
            id: f.id.toString(),
            bio: f.user.bio || null,
            iam_following: f.iam_following,
          }));
          setFollowers(followersData);
        } catch (error: any) {
          setAlertMsg('Failed to load followers');
          setAlertOpen(true);
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
          const followingData = response.data.map((f: any) => ({
            id: f.user.id.toString(),
            name: `${f.user.firstname} ${f.user.lastname}`,
            bio: f.user.bio || null,
            iam_following: f.iam_following,
            profile_picture: f.profile_picture,
          }));
          setFollowing(followingData);
        } catch (error: any) {
          setAlertMsg('Failed to load following');
          setAlertOpen(true);
        }
      };
      fetchFollowing();
    }
  }, [isFollowingOpen, id, apiClient]);

  const handleEnrollClick = () => {
    navigate('/');
  };

  if (!profile) {
    return <div className="flex items-center justify-center h-full text-sm font-bold">
      <div className="loader"></div>
    </div>;
  }

  return (
    <div className="w-full flex h-full">
      <div
        ref={containerRef}
        className="w-full h-full flex-[4] max-xl:p-8 max-lg:p-6 max-md:p-4 overflow-x-hidden overflow-y-scroll flex flex-col gap-2"
      >
        <div
          onClick={handleEnrollClick}
          className="cursor-pointer mx-10 mt-10 w-10 min-h-10 rotate-180 mb-5 bg-gray-300 rounded-full flex items-center justify-center"
        >
          <ForwardArrowSVG size={13} />
        </div>
        <div className="profile px-10 max-sm:px-4 max-sm:flex-col border-b border-b-gray-200 pb-10 flex gap-2">
          <div className="left w-20 min-w-20 bg-gray-300 h-20 overflow-hidden rounded-full">
            <img src={profile.profile_picture} alt="profile picture" className='w-full h-full object-cover' />
          </div>
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
                <h2 className="font-bold text-sm">{profile.followers || 0}</h2>
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
                <h2 className="font-bold text-sm">{profile.following || 0}</h2>
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
                author={`${post?.user?.firstname || 'NULL'} ${post?.user?.lastname || 'NULL'}`}
                institution={post.topic.name}
                time={post.updated_at}
                isCommentScreen={true}
                isSingleUser={true}
                profilePicture={post?.user?.profile_picture || 'NULL'}
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
      <div className="overflow-y-scroll  max-md:flex-[2] max-sm:hidden max-lg:hidden flex-[3]">
        <RightSideBar />
      </div>
      <AlertMessage open={alertOpen} message={alertMsg} onClose={() => setAlertOpen(false)} severity="purple" />
    </div>
  );
};

export default ProfilePage;