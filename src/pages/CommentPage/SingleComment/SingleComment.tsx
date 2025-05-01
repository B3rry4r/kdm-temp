import { useState } from "react";
import UserCard from "../../HomePage/HomePageComponents/UserCard";
import { CloseSVG, CommentSVG, LikeSVG } from "../../../assets/icons/icons";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AlertMessage from '../../../components/AlertMessage';
import { Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

type Props = {
  comment: {
    id: number;
    user_id: number;
    post_id: number;
    comment: string;
    created_at: string;
    updated_at: string;
    likes_count: number;
    liked: boolean;
    user: {
      id: number;
      firstname: string;
      lastname: string;
      profile_picture: string;
    } | null;
  };
  isNoInteractions?: boolean;
};

const SingleComment = ({ comment, isNoInteractions }: Props) => {
  const { apiClient, user } = useAuth();
  const [isLikeOpen, setIsLikeOpen] = useState(false);
  const [isMoreComments, setIsMoreComments] = useState(false);
  const [isReplyInputOpen, setIsReplyInputOpen] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [replies, setReplies] = useState<any[]>([]);
  const [likesCount, setLikesCount] = useState(comment.likes_count);
  const [liked, setLiked] = useState(comment.liked);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Fetch replies when comment count is clicked
  const showAllComments = async () => {
    setIsMoreComments(!isMoreComments);
    if (!isMoreComments) {
      try {
        const response = await apiClient.get(`/post/comment/replies/${comment.id}`);
        console.log(`Replies for comment ${comment.id}:`, response.data);
        setReplies(response.data);
      } catch (err: any) {
        console.error(`Error fetching replies for comment ${comment.id}:`, err);
      }
    }
  };

  // Toggle like/unlike
  const toggleLike = async () => {
    if (!user || !user.id) {
      alert("Please log in to like comments");
      return;
    }
    try {
      const payload = { comment_id: comment.id, user_id: user.id };
      console.log("Liking/unliking comment with payload:", payload);
      const response = await apiClient.post("/post/comment/like", payload);
      console.log("Like response:", response.data);
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    } catch (err: any) {
      console.error("Error liking comment:", err);
      alert("Failed to like/unlike comment");
    }
  };

  // Post a reply
  const handlePostReply = async () => {
    if (!newReply.trim()) {
      alert("Reply cannot be empty");
      return;
    }
    if (!user || !user.id) {
      alert("Please log in to reply");
      return;
    }
    try {
      const payload = {
        user_id: user.id,
        comment_id: comment.id,
        comment: newReply,
      };
      console.log("Posting reply with payload:", payload);
      const response = await apiClient.post("/post/comment/reply", payload);
      console.log("Reply posted:", response.data);

      // Refresh replies
      const repliesResponse = await apiClient.get(`/post/comment/replies/${comment.id}`);
      setReplies(repliesResponse.data);
      setNewReply("");
      setIsReplyInputOpen(false);
    } catch (err: any) {
      console.error("Error posting reply:", err);
      alert("Failed to post reply");
    }
  };

  // Format time (e.g., "20hrs ago")
  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    return `${diffHrs}hrs ago`;
  };

  // Add emoji handler
  const onEmojiClick = (emojiObject: any) => {
    setNewReply(prevReply => prevReply + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <div className="min-w-9 w-9 h-9 min-h-9 rounded-full bg-gray-300">
          {comment.user?.profile_picture && (
            <img
              src={comment.user.profile_picture}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          )}
        </div>
        <div className="flex w-[90%] flex-col">
          <div className="name flex items-center gap-2">
            <p className="text-sm font-bold">
              {comment.user
                ? `${comment.user.firstname} ${comment.user.lastname}`
                : "Unknown"}
            </p>
            <div className="line w-1 h-1 rounded-full bg-gray-500" />
            <p className="text-xs text-gray-500">{formatTime(comment.created_at)}</p>
          </div>
          <p className="text-[11px]">{comment.comment}</p>

          {!isNoInteractions && (
            <div className="left mt-3 flex items-center gap-2">
              <div className="like flex relative items-center gap-1">
                <div onClick={toggleLike} className="cursor-pointer">
                  <LikeSVG size={15} color={liked ? "#68049B" : "#544D58"} />
                </div>
                <p
                  onClick={() => setIsLikeOpen(!isLikeOpen)}
                  className="text-xs cursor-pointer text-gray-500"
                >
                  {likesCount}
                </p>
                {isLikeOpen && (
                  <div className="w-80 p-8 flex flex-col gap-2 absolute bottom-[-250px] z-8 left-0 rounded-xl bg-white border border-gray-200 h-80">
                    <div className="w-full items-center justify-between flex">
                      <h1 className="font-bold">{likesCount} Likes</h1>
                      <div
                        className="cursor-pointer"
                        onClick={() => setIsLikeOpen(!isLikeOpen)}
                      >
                        <CloseSVG size={15} />
                      </div>
                    </div>
                    <div className="overflow-y-scroll h-full w-full">
                      <UserCard />
                      <UserCard />
                      <UserCard />
                      <UserCard />
                      <UserCard />
                      <UserCard />
                      <UserCard />
                    </div>
                  </div>
                )}
              </div>
              <div
                onClick={() => {
                  setIsReplyInputOpen(true);
                  showAllComments();
                }}
                className="comment flex cursor-pointer items-center gap-1"
              >
                <CommentSVG size={15} />
                <p className="text-xs text-gray-500">{replies.length}</p>
              </div>
            </div>
          )}

          {/* Reply input */}
          {isReplyInputOpen && (
            <div className="mt-3 bg-[rgba(255,255,255,0.3)] rounded-lg backdrop-blur-xs">
              <div className="bg-white p-2 flex flex-col rounded-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center w-full">
                    <div className="min-w-8 min-h-8 rounded-full w-8 h-8 overflow-hidden bg-gray-300">
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
                      className="w-full h-[50px] ml-2 p-2 resize-none text-sm outline-none"
                      placeholder="Type your reply..."
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <div className="relative">
                      <Smile 
                        size={20} 
                        className="cursor-pointer text-gray-500" 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      />
                      {showEmojiPicker && (
                        <div className="absolute bottom-10 right-0 z-50">
                          <EmojiPicker onEmojiClick={onEmojiClick} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full mt-5 flex justify-end">
                  <button
                    onClick={handlePostReply}
                    className="px-5 py-1 bg-[#FFD30F] font-bold text-sm rounded-sm"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Replies */}
          {isMoreComments && (
            <div className="mt-6 p-2 flex flex-col gap-4">
              {replies.map((reply) => (
                <SingleComment
                  key={reply.id}
                  comment={reply}
                  isNoInteractions={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <AlertMessage
        open={alertOpen}
        message={alertMsg}
        severity="purple"
        onClose={() => setAlertOpen(false)}
      />
    </div>
  );
};

export default SingleComment;