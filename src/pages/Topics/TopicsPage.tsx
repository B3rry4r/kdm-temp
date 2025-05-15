import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import ContentCard from "../HomePage/HomePageComponents/ContentCard";
import RightSideBar from "../../components/RightSideBar/RightSideBar";
import { FollowPlus, ShareSVG } from "../../assets/icons/icons";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useData } from "../../context/DataContext/DataContext";
import { CheckCircle2Icon } from "lucide-react";
import AlertMessage from '../../components/AlertMessage';
import { useSearch } from '../../components/header/Header';

// Interface for topic post
interface TopicPost {
  id: number;
  user_id: number;
  topic_id: number;
  content: string;
  image_urls: string[];
  likes_count: number;
  comments_count: number;
  liked: boolean;
  saved: boolean;
  updated_at: string;
  user: {
    id: number;
    firstname: string;
    lastname: string;
    profile_picture: string | null;
    active_subscription: boolean;
    is_consultant_profile: boolean;
    is_an_admin: boolean;
    group_admin_data: object | null;
    is_active: boolean;
  } | null;
  topic: {
    id: number;
    name: string;
    logo: string;
    banner: string;
    follower_count: number;
    is_user_following: boolean;
  };
}

// Interface for paginated topic posts response
interface PaginatedTopicPostsResponse {
  current_page: number;
  data: TopicPost[];
  last_page: number;
  per_page: number;
  total: number;
}

const TopicsPage = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const { apiClient, isAuthenticated } = useAuth();
  const { topics } = useData();
  const { searchQuery } = useSearch();
  const [content, setContent] = useState<Array<{ type: string; data: any }>>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  // Find topic details
  const topic = topicId ? topics.find((t) => t.id === parseInt(topicId)) : null;
  const topicName = topic?.name || "Unknown Topic";
  const topicLogo = topic?.logo || null;
  const topicBanner = topic?.banner || null;

  // Filter content based on search query
  const filteredContent = useMemo(() => {
    if (!searchQuery.trim() || !content.length) {
      return content;
    }
    
    const query = searchQuery.toLowerCase();
    return content.filter(item => {
      if (item.type === 'content') {
        return (
          item.data.description.toLowerCase().includes(query) ||
          item.data.author.toLowerCase().includes(query) ||
          item.data.institution.toLowerCase().includes(query)
        );
      }
      return false;
    });
  }, [content, searchQuery]);

  // Initialize follower count and isFollowing
  useEffect(() => {
    if (topic) {
      if (topic.follower_count !== undefined) {
        setFollowerCount(topic.follower_count);
      }
      if (topic.is_user_following !== undefined) {
        setIsFollowing(topic.is_user_following);
      }
    }
  }, [topic]);

  // Fetch topic posts
  const fetchPosts = async (pageNum: number) => {
    if (!topicId || !isAuthenticated || isLoading || !hasMore) {
      if (!topicId) setError("Invalid topic ID");
      if (!isAuthenticated) setError("Not authenticated");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log(`Fetching posts for topicId: ${topicId}, page: ${pageNum}`);

    try {
      const response = await apiClient.get<PaginatedTopicPostsResponse>(`/posts/topic/${topicId}`, {
        params: { page: pageNum, perPage: 10 },
      });
      console.log(`Fetched posts for topicId ${topicId}:`, JSON.stringify(response.data, null, 2));

      const posts = response.data.data.map((post) => ({
        type: 'content',
        data: {
          id: post.id.toString(),
          userId: post.user_id.toString(),
          title: post.content.substring(0, 50) + (post.content.length > 50 ? "..." : ""),
          description: post.content,
          image: post.image_urls[0] || null,
          likes: post.likes_count,
          comments: post.comments_count,
          shares: 0, // shares_count not provided in JSON, default to 0
          author: post.user
            ? `${post.user.firstname} ${post.user.lastname}`
            : "Unknown Author",
          institution: post.topic.name || "Unknown Topic",
          time: post.updated_at,
          profilePicture: post.user?.profile_picture
            ? `${post.user.profile_picture}?t=${Date.now()}` // Cache-busting
            : null,
        },
      }));

      setContent((prevContent) => [...prevContent, ...posts]);
      setPage(pageNum + 1);
      setHasMore(response.data.current_page < response.data.last_page);
    } catch (err: any) {
      console.error("Error fetching posts:", err.response?.data || err.message);
      setError("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    setContent([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1);
  }, [topicId, isAuthenticated]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isLoading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 2) {
        console.log('Fetching more posts...');
        fetchPosts(page);
      }
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [page, isLoading, hasMore, topicId, isAuthenticated]);

  // Handle follow/unfollow action
  const handleFollow = async () => {
    if (!topicId || !isAuthenticated) {
      setError("You must be authenticated to follow a topic");
      return;
    }

    setIsFollowLoading(true);
    try {
      await apiClient.post(`/topics/follow/${topicId}`);
      const newFollowStatus = !isFollowing;
      setIsFollowing(newFollowStatus);
      setFollowerCount((prev) => prev + (newFollowStatus ? 1 : -1));
    } catch (err: any) {
      console.error("Error following/unfollowing topic:", err.response?.data || err.message);
      setError("Failed to update follow status");
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Copy topic link to clipboard
  const getPostUrl = () => {
    const baseUrl = window.location.origin;
    const postPath = `/topics/${topicId || "unknown"}`;
    const fullUrl = `${baseUrl}${postPath}`;
    console.log("Constructed post URL:", fullUrl);
    return fullUrl;
  };

  const handleCopyLink = async () => {
    const postUrl = getPostUrl();
    try {
      await navigator.clipboard.writeText(postUrl);
      console.log("Copied post URL:", postUrl);
      setAlertMsg('Topic link copied to clipboard!');
      setAlertOpen(true);
    } catch (err) {
      console.error("Failed to copy post link:", err);
      setAlertMsg('Failed to copy topic link');
      setAlertOpen(true);
    }
  };

  if (isLoading && content.length === 0) {
    return (
      <div className="w-full flex items-center justify-center h-full">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex items-center justify-center h-full">
        <p className="text-[#68049B] text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div
        ref={containerRef}
        className="p-5 flex-[4] flex flex-col gap-10 overflow-y-auto h-full"
      >
        <div className="w-full min-h-[100px] h-[150px] bg-gray-200 rounded-xl">
          {topicBanner ? <img src={topicBanner} alt="topic_banner" className="w-full h-full object-cover rounded-xl" /> : null}
        </div>
        <div className="profile border-b border-b-gray-200 pb-10 flex max-sm:flex-col gap-2">
          <div className="left w-20 bg-gray-300 h-20 rounded-full overflow-hidden">
            {topicLogo ? <img src={topicLogo} alt="topic_logo" className="w-full h-full object-cover" /> : null}
          </div>
          <div className="right flex flex-col p-2 gap-2 pr-4">
            <h1 className="text-xl font-bold">{topicName}</h1>
            <div className="flex items-center gap-1">
              <h2 className="font-bold">{followerCount}</h2>
              <p className="text-[10px]">Followers</p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center px-8 py-1 ${
                  isFollowing ? "bg-gray-200" : "bg-[#FFD30F]"
                } rounded-md gap-2 justify-center relative`}
              >
                {isFollowing ? <CheckCircle2Icon size={12} /> : <FollowPlus size={12} />}
                <button
                  className={`text-gray-500 cursor-pointer text-sm font-bold`}
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                >
                  {isFollowing ? "Joined" : "Follow"}
                </button>
                {isFollowLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#FFD30F] bg-opacity-75 rounded-md">
                    <div className="loader"></div>
                  </div>
                )}
              </div>
              <div onClick={handleCopyLink} className="cursor-pointer">
                <ShareSVG size={12} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Search Results Info */}
        {searchQuery && (
          <div className="my-4">
            <p className="text-sm">
              Showing results for: <span className="font-semibold">{searchQuery}</span> in {topicName}
            </p>
          </div>
        )}
        
        {filteredContent.length > 0 ? (
          filteredContent.map((item, index) => (
            <ContentCard key={index} {...item.data} />
          ))
        ) : (
          <p className="text-sm text-gray-500">
            {searchQuery 
              ? `No posts found matching "${searchQuery}" in this topic.` 
              : "No posts found for this topic."}
          </p>
        )}
        {isLoading && (
          <div className="w-full flex items-center justify-center">
            <div className="loader"></div>
          </div>
        )}
        {!hasMore && content.length > 0 && !searchQuery && (
          <div className="text-center text-xs font-bold">No more posts to load.</div>
        )}
      </div>
      <div className="flex-[3] max-lg:hidden max-md:flex-[2] max-sm:hidden overflow-y-auto h-full">
        <RightSideBar />
      </div>
      <AlertMessage open={alertOpen} message={alertMsg} severity="purple" onClose={() => setAlertOpen(false)} />
    </div>
  );
};

export default TopicsPage;