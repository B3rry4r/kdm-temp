import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ContentCard from "../HomePage/HomePageComponents/ContentCard";
import RightSideBar from "../../components/RightSideBar/RightSideBar";
import { FollowPlus, ShareSVG } from "../../assets/icons/icons";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useData } from "../../context/DataContext/DataContext";
import { CheckCircle2Icon } from "lucide-react";

// Interface for post response
interface TopicPost {
  id: number;
  user_id: number;
  topic_id: number;
  content: string;
  image_urls: string[];
  likes_count: number;
  comments_count: number;
  shares_count?: number;
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
  } | null;
  topic: {
    id: number;
    name: string;
    logo: string;
  };
}

const TopicsPage = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const { apiClient, isAuthenticated } = useAuth();
  const { topics } = useData();
  const [posts, setPosts] = useState<TopicPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false); // Loader for follow action

  // Find topic name and details
  const topic = topicId ? topics.find((t) => t.id === parseInt(topicId)) : null;
  const topicName = topic?.name || "Unknown Topic";
  const topicLogo = topic?.logo || null;
  const topicBanner = topic?.banner || null;

  // Initialize follower count
  useEffect(() => {
    if (topic?.follower_count !== undefined) {
      setFollowerCount(topic.follower_count);
    }
  }, [topic]);

  // Fetch topic posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (!topicId || !isAuthenticated) {
        setError("Invalid topic ID or not authenticated");
        setIsLoading(false);
        return;
      }

      try {
        const postsResponse = await apiClient.get(`/posts/topic/${topicId}`);
        const fetchedPosts: TopicPost[] = postsResponse.data;
        if (Array.isArray(fetchedPosts)) {
          setPosts(fetchedPosts);
        } else {
          setError("Invalid posts data");
        }
      } catch (err: any) {
        console.error("Error fetching posts:", err.response?.data || err.message);
        setError("Failed to load posts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [topicId, isAuthenticated, apiClient]);

  // Handle follow/unfollow action
  const handleFollow = async () => {
    if (!topicId || !isAuthenticated) {
      setError("You must be authenticated to follow a topic");
      return;
    }

    setIsFollowLoading(true);
    try {
      await apiClient.post(`/topics/follow/${topicId}`);
      const newFollowStatus = !isFollowing; // Toggle follow status
      setIsFollowing(newFollowStatus);
      setFollowerCount((prev) => prev + (newFollowStatus ? 1 : -1));
    } catch (err: any) {
      console.error("Error following/unfollowing topic:", err.response?.data || err.message);
      setError("Failed to update follow status");
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
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
      <div className="p-5 flex-[3] flex flex-col gap-10 overflow-y-auto h-full">
        <div className="w-full min-h-[100px] bg-gray-200 rounded-xl">
          {topicBanner !== null ? <img src={topicBanner} alt="topic_banner" /> : null}
        </div>
        <div className="profile border-b border-b-gray-200 pb-10 flex max-sm:flex-col gap-2">
          <div className="left w-20 bg-gray-300 h-20 rounded-full">
            {topicLogo !== null ? <img src={topicLogo} alt="topic_logo" /> : null}
          </div>
          <div className="right flex flex-col p-2 gap-2 pr-4">
            <h1 className="text-xl font-bold">{topicName}</h1>
            <div className="flex items-center gap-1">
              <h2 className="font-bold">{followerCount}</h2>
              <p className="text-[10px]">Followers</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center px-8 py-1 ${isFollowing ? 'bg-gray-200': 'bg-[#FFD30F]'}  rounded-md gap-2 justify-center relative`}>
                {
                  isFollowing ? <CheckCircle2Icon size={12} /> : <FollowPlus size={12} />
                }
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
              <ShareSVG size={12} />
            </div>
          </div>
        </div>
        {posts.length > 0 ? (
          posts.map((post) => (
            <ContentCard
              key={post.id}
              id={post.id.toString()}
              userId={post.user_id.toString()}
              title={
                post.content.substring(0, 50) +
                (post.content.length > 50 ? "..." : "")
              }
              description={post.content}
              image={post.image_urls[0] || null}
              likes={post.likes_count}
              comments={post.comments_count}
              shares={post.shares_count || 0}
              author={
                post.user
                  ? `${post.user.firstname} ${post.user.lastname}`
                  : "Unknown Author"
              }
              institution={post.topic.name}
              time={post.updated_at}
              profilePicture={post.user?.profile_picture || null}
            />
          ))
        ) : (
          <p className="text-sm text-gray-500">
            No posts found for this topic.
          </p>
        )}
      </div>
      <div className="flex-[3] max-sm:hidden overflow-y-auto h-full">
        <RightSideBar />
      </div>
    </div>
  );
};

export default TopicsPage;