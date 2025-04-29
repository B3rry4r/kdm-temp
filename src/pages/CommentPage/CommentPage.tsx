import { ForwardArrowSVG } from "../../assets/icons/icons";
import { useNavigate, useParams } from "react-router-dom";
import RightSideBar from "../../components/RightSideBar/RightSideBar";
import ContentCard from "../HomePage/HomePageComponents/ContentCard";
import SingleComment from "./SingleComment/SingleComment";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useState, useEffect } from "react";

const CommentPage = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const { apiClient, user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch post details and comments when postId changes
  useEffect(() => {
    const fetchPostAndComments = async () => {
      console.log("started");

      setLoading(true);
      setError(null);
      try {
        // Fetch post details
        console.log("started post get");
        const postResponse = await apiClient.get(`/post/${postId}`);
        console.log("Post API response:", postResponse.data);
        setPost(postResponse.data);

        // Fetch comments for the post
        console.log("started comment");
        const commentsResponse = await apiClient.get(
          `/post/comments/${postId}`
        );
        console.log("Comments API response:", commentsResponse.data);
        setComments(commentsResponse.data);
      } catch (err: any) {
        console.error("Error fetching post or comments:", err);
        setError("Failed to load post or comments");
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPostAndComments();
    }
  }, [postId, apiClient]);

  // Handle posting a new comment
  const handlePostComment = async () => {
    if (!newComment.trim()) {
      alert("Comment cannot be empty");
      return;
    }
    if (!user || !user.id) {
      alert("User not authenticated");
      return;
    }
    try {
      const payload = {
        user_id: user.id,
        post_id: postId,
        comment: newComment,
      };
      console.log("Posting new comment with payload:", payload);
      await apiClient.post("/post/comment", payload);
      console.log("Comment posted successfully");

      // Refresh comments after posting
      const commentsResponse = await apiClient.get(`/post/comments/${postId}`);
      setComments(commentsResponse.data);
      setNewComment("");
    } catch (err: any) {
      console.error("Error posting comment:", err);
      alert("Failed to post comment");
    }
  };

  // Handle navigation back
  const handleEnrollClick = () => {
    navigate(`/`);
  };

  // Loading and error states
  if (loading) {
    return (
      <div className="w-full h-full flex items-center text-xs justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center text-xs justify-center">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full flex h-full">
      <div className="w-full flex-[3] max-sm:w-full max-sm:p-4 max-sm:pb-10 overflow-y-scroll flex flex-col gap-2 p-10">
        {/* Back button */}
        <div
          onClick={handleEnrollClick}
          className="cursor-pointer w-10 min-h-10 rotate-180 mb-5 bg-gray-300 rounded-full flex items-center justify-center"
        >
          <ForwardArrowSVG size={13} />
        </div>

        {/* Post content */}
        {post && (
          <ContentCard
            isCommentScreen={true}
            title={post.title || "Post"}
            description={post.content || ""}
            image={
              post.image_urls && post.image_urls.length > 0
                ? post.image_urls[0]
                : null
            }
            likes={post.likes_count || 0}
            comments={post.comments_count || 0}
            shares={post.shares_count || 0}
            author={
              post.user
                ? `${post.user.firstname} ${post.user.lastname}`
                : "Unknown"
            }
            institution={post.topic ? post.topic.name : "Unknown"}
            time={post.updated_at || "Unknown"}
            id={post.id}
            userId={post.user?.id}
            profilePicture={post.user?.profile_picture || null}
          />
        )}

        {/* New comment input */}
        <div className="w-full bg-[rgba(255,255,255,0.3)] mb-3 rounded-lg backdrop-blur-xs">
          <div className="bg-white p-2 flex flex-col rounded-xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="min-w-8 max-w-8 max-h-8 min-h-8 rounded-full overflow-hidden bg-gray-300">
                {user && user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt="user image"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"; // Hide image on error
                        e.currentTarget.parentElement!.style.backgroundColor = "rgb(209 213 219)"; // Restore gray background
                      }}
                    />
                  ) : null}
                </div>
                <textarea
                  className="w-full h-[50px] mt-2 p-2 resize-none text-[12px] outline-none"
                  placeholder="Type your message..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                ></textarea>
              </div>
              <div className="flex gap-1">
                {/* <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                <div className="w-4 h-4 bg-gray-400 rounded-full"></div> */}
              </div>
            </div>
            <div className="w-full mt-5 flex justify-end">
              <button
                onClick={handlePostComment}
                className="px-5 py-1 bg-[#FFD30F] font-bold text-xs rounded-sm"
              >
                Post
              </button>
            </div>
          </div>
        </div>

        {/* Comments list */}
        <div className="w-full mt-6 flex flex-col gap-6">
          {comments.map((comment) => (
            <SingleComment
              key={comment.id}
              comment={comment}
              isNoInteractions={false}
            />
          ))}
        </div>
      </div>
      <div className="overflow-y-scroll max-sm:hidden flex-[3]">
        <RightSideBar />
      </div>
    </div>
  );
};

export default CommentPage;
