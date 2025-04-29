import { useState, useEffect } from "react";
import ContentCard from "../HomePage/HomePageComponents/ContentCard";
import RightSideBar from "../../components/RightSideBar/RightSideBar";
import { useAuth } from "../../context/AuthContext/AuthContext";

// Interface for saved posts response (same as ContentCard)
interface SavedPost {
  id: number;
  user_id: number;
  post_id: number;
  post: {
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

// Utility to format time (e.g., "2 hours ago")
const formatTime = (updatedAt: string): string => {
  console.log('Parsing updated_at:', updatedAt);

  // Check if updatedAt is a relative time string (e.g., "1 month ago")
  const relativeTimeRegex = /^\d+\s+(minute|hour|day|week|month|year)s?\s+ago$/;
  if (relativeTimeRegex.test(updatedAt)) {
    console.log('Detected relative time:', updatedAt);
    return updatedAt; // Pass through relative time strings
  }

  // Try parsing as ISO date
  const updated = new Date(updatedAt);
  if (isNaN(updated.getTime())) {
    console.error('Invalid date for updated_at:', updatedAt);
    return "Just now";
  }

  const now = new Date();
  const diffMs = now.getTime() - updated.getTime();

  // Handle future dates
  if (diffMs < 0) {
    console.warn('Future date detected for updated_at:', updatedAt);
    return "Just now";
  }

  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  console.log('Time diff:', { diffMinutes, diffHours, diffDays });

  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
};

const SavedPosts = () => {
  const { user, isAuthenticated, apiClient } = useAuth();
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      console.log('Fetching saved posts, auth:', { isAuthenticated, userId: user?.id });
      if (!isAuthenticated || !user?.id) {
        setError("Please log in to view saved posts");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.get("/posts/saved");
        const posts: SavedPost[] = response.data;
        if (!Array.isArray(posts)) {
          throw new Error("Invalid response format");
        }
        console.log('Fetched saved posts:', JSON.stringify(posts, null, 2));
        setSavedPosts(posts);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching saved posts:", err.response?.data || err.message);
        setError("Failed to load saved posts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPosts();
  }, [isAuthenticated, user?.id, apiClient]);

  if(loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="loader"></div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="p-10 flex-[4] max-sm:p-4 max-sm:gap-5 flex flex-col gap-10 overflow-y-auto h-full">
        <h1 className="text-2xl font-bold">Saved Posts</h1>
        { error ? (
          <p className="text-red-500">{error}</p>
        ) : savedPosts.length === 0 ? (
          <p className="text-gray-500">No saved posts found.</p>
        ) : (
          savedPosts.map((savedPost) => (
            <ContentCard
              key={savedPost.post.id}
              id={savedPost.post.id.toString()}
              title={savedPost.post.content.substring(0, 50) + (savedPost.post.content.length > 50 ? "..." : "")}
              description={savedPost.post.content}
              image={savedPost.post.image_urls[0] || null}
              likes={savedPost.post.likes_count}
              comments={savedPost.post.comments_count}
              shares={0}
              author={`${savedPost.user.firstname} ${savedPost.user.lastname}`}
              institution="SME MATTER"
              time={formatTime(savedPost.post.updated_at)}
              profilePicture={savedPost.user.profile_picture || null}
            />
          ))
        )}
      </div>
      <div className="flex-[3] max-sm:hidden overflow-y-auto h-full">
        <RightSideBar />
      </div>
    </div>
  );
};

export default SavedPosts;