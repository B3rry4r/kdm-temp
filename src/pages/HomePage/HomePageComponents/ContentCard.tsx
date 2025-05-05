import { useState, useEffect } from "react";
import {
  BookmarkSVG,
  CloseSVG,
  CommentSVG,
  CopyLinkSVG,
  DeleteSVG,
  EditSVG,
  FbSVG,
  FollowPlus,
  IGSVG,
  LikeSVG,
  ShareSVG,
  XSVG,
} from "../../../assets/icons/icons";
import { DynamicRow } from "../../MyCoursesPage/SingleCousre/MySingleCourse";
import Modal from "../../Registration/Modal";
import UserCard from "./UserCard";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import { useData } from "../../../context/DataContext/DataContext";
import { usePostUpdate } from "../../../context/PostUpdateContext/PostUpdateContext";
import { ChevronDown, Image as ImageIcon, MinusCircle, Smile } from "lucide-react";
import AlertMessage from '../../../components/AlertMessage';
import EmojiPicker from 'emoji-picker-react';
import { Link } from 'react-router-dom';

// Fallback profile image
const defaultProfileImage = "https://via.placeholder.com/150?text=User";

// Interface for saved posts response
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

// Interface for follower response
interface Follower {
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
  };
}

type Props = {
  title: string;
  description: string;
  image: string | null;
  likes: number;
  comments: number;
  shares?: number;
  author: string;
  institution: string;
  time: string;
  isCommentScreen?: boolean;
  isSingleUser?: boolean;
  id?: string;
  userId?: string;
  profilePicture?: string | null;
};

const ContentCard = (props: Props) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, apiClient } = useAuth();
  const { topics, loading: dataLoading, error: dataError } = useData();
  const { triggerRefresh } = usePostUpdate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isRSubmit, setIsRSubmit] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLikeOpen, setIsLikeOpen] = useState(false);
  const [flow, setFlow] = useState<"edit" | "delete" | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(props.likes);
  const [isLiking, setIsLiking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopicSelectorOpen, setIsTopicSelectorOpen] = useState(false);
  const [postContent, setPostContent] = useState(props.description);
  const [images, setImages] = useState<File[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Fetch initial saved state and followers
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user?.id) {
        setSaved(false);
        setFollowerCount(0);
        setIsFollowing(false);
        setIsLoading(false);
        return;
      }

      try {
        const [savedResponse, followersResponse] = await Promise.all([
          props.id ? apiClient.get('/posts/saved') : Promise.resolve({ data: [] }),
          props.userId ? apiClient.get(`/profile/followers/${props.userId}`) : Promise.resolve({ data: [] }),
        ]);

        // Handle saved posts
        const savedPosts: SavedPost[] = savedResponse.data;
        if (Array.isArray(savedPosts) && props.id) {
          const userSavedPosts = savedPosts.filter((post) => post.user_id.toString() === user.id.toString());
          const isSaved = userSavedPosts.some((post) => post.post_id.toString() === props.id?.toString());
          setSaved(isSaved);
        } else {
          setSaved(false);
        }

        // Handle followers
        const followers: Follower[] = followersResponse.data;
        if (Array.isArray(followers)) {
          setFollowerCount(followers.length);
          const isFollowingUser = followers.some((follower) => follower.user_id.toString() === user.id.toString());
          setIsFollowing(isFollowingUser);
        } else {
          setFollowerCount(0);
          setIsFollowing(false);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err.response?.data || err.message);
        setSaved(false);
        setFollowerCount(0);
        setIsFollowing(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [props.id, props.userId, isAuthenticated, user?.id, apiClient]);

  // Set initial topic based on props.institution
  useEffect(() => {
    if (topics.length > 0 && props.institution) {
      const topic = topics.find((t) => t.name === props.institution);
      setSelectedTopicId(topic ? topic.id : 1); // Default to SME Mata (id: 1)
    }
  }, [topics, props.institution]);

  // Like/Unlike post
  const toggleLike = async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('Unauthenticated user attempted to like post, redirecting to /login');
      navigate('/login');
      return;
    }

    if (isLiking || !props.id) return;

    setIsLiking(true);
    try {
      const response = await apiClient.post('/posts/like', {
        post_id: props.id,
        user_id: user.id,
      });
      console.log('POST /posts/like response:', JSON.stringify(response.data, null, 2));

      const { status } = response.data;

      if (status) {
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      } else {
        setLiked(false);
        setLikesCount((prev) => prev - 1);
      }
    } catch (err: any) {
      console.error('Like error:', err.response?.data || err.message);
      setAlertMsg('Failed to like/unlike post. Please try again.');
      setAlertSeverity('error');
      console.log(alertSeverity);
      setAlertOpen(true);
    } finally {
      setIsLiking(false);
    }
  };

  // Save/Unsave post
  const toggleSave = async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('Unauthenticated user attempted to save post, redirecting to /login');
      navigate('/login');
      return;
    }

    if (isSaving || !props.id) return;

    setIsSaving(true);
    try {
      const response = await apiClient.post('/posts/save', {
        post_id: props.id,
        user_id: user.id,
      });
      console.log('POST /posts/save response:', JSON.stringify(response.data, null, 2));

      const { status } = response.data;

      if (status) {
        setSaved(true);
      } else {
        setSaved(false);
      }
    } catch (err: any) {
      console.error('Save error details:', err.response?.data || err.message);
      setAlertMsg('Failed to save/unsave post. Please try again.');
      setAlertSeverity('error');
      setAlertOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Follow/Unfollow user
  const toggleFollow = async () => {
    if (!isAuthenticated || !user?.id || !props.userId) {
      console.log('Unauthenticated user attempted to follow user, redirecting to /login');
      navigate('/login');
      return;
    }
    if (props.userId === user.id.toString()) {
      return;
    }
    if (isFollowingLoading) return;

    setIsFollowingLoading(true);
    try {
      const response = await apiClient.post(`/profile/follow/${props.userId}`);
      console.log('POST /profile/follow/${props.userId} response:', JSON.stringify(response.data, null, 2));

      const { status } = response.data;

      if (status) {
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      } else {
        setIsFollowing(false);
        setFollowerCount((prev) => prev - 1);
      }
    } catch (err: any) {
      console.error('Follow error:', err.response?.data || err.message);
      setAlertMsg('Failed to follow/unfollow user. Please try again.');
      setAlertSeverity('error');
      setAlertOpen(true);
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const openFlow = (type: "edit" | "delete") => {
    if (!isAuthenticated || !user?.id) {
      console.log('Unauthenticated user attempted to open edit/delete modal, redirecting to /login');
      navigate('/login');
      return;
    }
    setFlow(type);
  };

  const closeModal = () => {
    setFlow(null);
    setPostContent(props.description);
    setImages([]);
    setSelectedTopicId(topics.find((t) => t.name === props.institution)?.id || 1);
    setIsTopicSelectorOpen(false);
    setIsSubmitting(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated || !user?.id) {
      console.log('Unauthenticated user attempted to upload image, redirecting to /login');
      navigate('/login');
      return;
    }
    const files = e.target.files;
    if (files && files.length > 0) {
      setImages((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeImage = (index: number) => {
    if (!isAuthenticated || !user?.id) {
      console.log('Unauthenticated user attempted to remove image, redirecting to /login');
      navigate('/login');
      return;
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTopicSelect = (topicId: number) => {
    if (!isAuthenticated || !user?.id) {
      console.log('Unauthenticated user attempted to select topic, redirecting to /login');
      navigate('/login');
      return;
    }
    setSelectedTopicId(topicId);
    setIsTopicSelectorOpen(false);
  };

  const handleEditPost = async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('Unauthenticated user attempted to edit post, redirecting to /login');
      navigate('/login');
      return;
    }

    if (!postContent.trim()) {
      setAlertMsg("Post content cannot be empty");
      setAlertSeverity('error');
      setAlertOpen(true);
      return;
    }

    if (!selectedTopicId) {
      setAlertMsg("Please select a topic");
      setAlertSeverity('error');
      setAlertOpen(true);
      return;
    }

    if (!props.id) {
      setAlertMsg("Post ID is missing");
      setAlertSeverity('error');
      setAlertOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("user_id", user.id.toString());
      formData.append("topic_id", selectedTopicId.toString());
      formData.append("content", postContent);
      images.forEach((image) => {
        formData.append("images[]", image);
      });

      const response = await apiClient.post(`/post/edit/${props.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log('Edit post response:', JSON.stringify(response.data, null, 2));
      triggerRefresh();
      closeModal();
    } catch (err: any) {
      console.error('Edit post error:', err.response?.data || err.message);
      setAlertMsg(err.response?.data?.error || 'Failed to edit post. Please try again.');
      setAlertSeverity('error');
      setAlertOpen(true);
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('Unauthenticated user attempted to delete post, redirecting to /login');
      navigate('/login');
      return;
    }

    if (!props.id) {
      setAlertMsg("Post ID is missing");
      setAlertSeverity('error');
      setAlertOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.delete(`/post/${props.id}`);
      console.log('Delete post response:', JSON.stringify(response.data, null, 2));
      triggerRefresh();
      closeModal();
    } catch (err: any) {
      console.error('Delete post error:', err.response?.data || err.message);
      setAlertMsg(err.response?.data?.error || 'Failed to delete post. Please try again.');
      setAlertSeverity('error');
      setAlertOpen(true);
      setIsSubmitting(false);
    }
  };

  // Construct the post URL
  const getPostUrl = () => {
    const baseUrl = window.location.origin; // e.g., https://yourdomain.com
    const postPath = `/comments/${props.id || 'unknown'}`; // e.g., /post/123
    const fullUrl = `${baseUrl}${postPath}`;
    console.log('Constructed post URL:', fullUrl);
    return fullUrl;
  };

  // Copy post link to clipboard
  const handleCopyLink = async () => {
    const postUrl = getPostUrl();
    try {
      await navigator.clipboard.writeText(postUrl);
      setIsCopied(true);
      console.log('Copied post URL:', postUrl);
      await new Promise((res) => setTimeout(res, 2000));
      setIsCopied(false);
    } catch (err) {
      console.error('Failed to copy post link:', err);
      setAlertMsg('Failed to copy post link');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  // Share on Facebook
  const shareOnFacebook = () => {
    const postUrl = getPostUrl();
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    console.log('Sharing on Facebook:', shareUrl);
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setIsShareOpen(false);
  };

  // Share on Twitter (X)
  const shareOnTwitter = () => {
    const postUrl = getPostUrl();
    const text = encodeURIComponent(`Check out this post: ${props.title}`);
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${text}`;
    console.log('Sharing on Twitter:', shareUrl);
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setIsShareOpen(false);
  };

  // Share on Instagram
  const shareOnInstagram = () => {
    alert('To share on Instagram, copy the link and paste it in your Instagram post or story.');
    handleCopyLink(); // Copy the link for the user
    console.log('Instagram share initiated (copy link provided)');
  };

  // Handle emoji selection
  const onEmojiClick = (emojiObject: any) => {
    setPostContent(prevContent => prevContent + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const renderModalContent = () => {
    if (!flow) return null;

    if (flow === "edit") {
      const selectedTopic = topics.find((topic) => topic.id === selectedTopicId);
      return (
        <div className="w-full flex flex-col gap-3">
          <h1 className="font-bold text-xl">Edit Post</h1>
          <div
            onClick={() => {
              if (!isAuthenticated || !user?.id) {
                console.log('Unauthenticated user attempted to open topic selector, redirecting to /login');
                navigate('/login');
                return;
              }
              setIsTopicSelectorOpen(true);
            }}
            className="font-bold flex items-center gap-2 text-xs py-2 px-2 bg-gray-200 w-30 rounded-lg cursor-pointer"
          >
            {dataLoading ? <div className="loading"></div> : dataError ? "Error" : selectedTopic?.name || "Select Topic"}
            <ChevronDown size={20} />
          </div>
          <div className="bg-white p-2 flex flex-col items-end rounded-xl">
            <textarea
              className="w-full h-[50px] p-2 resize-none text-sm outline-none"
              placeholder="Type your message..."
              value={postContent}
              onChange={(e) => {
                if (!isAuthenticated || !user?.id) {
                  console.log('Unauthenticated user attempted to edit post content, redirecting to /login');
                  navigate('/login');
                  return;
                }
                setPostContent(e.target.value);
              }}
              disabled={isSubmitting}
            ></textarea>
            {images.length > 0 && (
              <div className="w-full flex gap-2 overflow-x-auto mt-2">
                {images.map((image, index) => (
                  <div key={index} className="relative w-16 h-16 rounded-md overflow-hidden">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`preview-${index}`}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-0 right-0 bg-black bg-opacity-60 text-white rounded-full p-1 text-xs"
                      disabled={isSubmitting}
                    >
                      <CloseSVG color={'gray'} size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <label htmlFor="image-upload" className="cursor-pointer">
                <ImageIcon size={20} />
              </label>
              <div className="relative">
                <Smile 
                  size={20} 
                  className="cursor-pointer" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                />
                {showEmojiPicker && (
                  <div className="absolute bottom-10 right-0 z-50">
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                  </div>
                )}
              </div>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <button
            onClick={handleEditPost}
            disabled={isSubmitting}
            className="mt-3 px-5 w-25 py-2 cursor-pointer flex items-center justify-center bg-[#FFD30F] font-bold text-sm rounded-sm text-black disabled:opacity-50"
          >
            {isSubmitting ? <div className="loader"></div> : 'Send'}
          </button>
        </div>
      );
    }
    if (flow === "delete") {
      return (
        <div className="w-full flex flex-col gap-4">
          <h1 className="font-bold text-xl text-center">Delete Post</h1>
          <p className="text-sm text-center">Are you sure you want to delete this post?</p>
          <div className="flex w-full items-center justify-between gap-2">
            <button
              onClick={closeModal}
              className="w-full py-2 border border-gray-300 rounded-lg text-gray-800 font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleDeletePost}
              disabled={isSubmitting}
              className="w-full py-2 bg-red-500 rounded-lg text-white font-bold disabled:opacity-50"
            >
              {isSubmitting ? <div className="loader"></div> : 'Delete'}
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  const toggleCopied = async () => {
    await handleCopyLink();
  };

  // const closeCopied = () => {
  //   setIsCopied(false);
  // };

  const toggleRS = async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('Unauthenticated user attempted to report post, redirecting to /login');
      navigate('/login');
      return;
    }
    setIsRSubmit(true);
    await new Promise((res) => setTimeout(res, 2000));
    setIsRSubmit(false);
  };

  const closeRS = () => {
    setIsRSubmit(false);
  };

  const toggleReportOverlay = () => {
    if (!isAuthenticated || !user?.id) {
      console.log('Unauthenticated user attempted to open report modal, redirecting to /login');
      navigate('/login');
      return;
    }
    setIsOverlayOpen(!isOverlayOpen);
  };

  const toggleProfileOpen = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const navigateToComment = () => {
    if (!isAuthenticated || !user?.id) {
      // console.log('Unauthenticated user attempted to comment, redirecting to /login');
      navigate('/login');
      return;
    }
    if (!props.isCommentScreen) {
      navigate(`/comments/${props.id || 'unknown'}`);
    }
  };

  const navToProfile = () => {
    navigate(`/profiles/${props.userId || 'unknown'}`);
  };

  const profileImageSrc = props.profilePicture || defaultProfileImage;

  // Format follower count (e.g., 1000 → "1k")
  const formatFollowerCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Ensure isSelf is always boolean
  const isSelf = !!user?.id && props.userId === user.id.toString();

  // Topic selector modal
  {isTopicSelectorOpen && (
    <Modal isOpen={isTopicSelectorOpen} onClose={() => setIsTopicSelectorOpen(false)}>
      <div className="w-full flex flex-col gap-3">
        <h1 className="font-bold text-xl">Select Topic</h1>
        {dataLoading ? (
          <p>Loading topics...</p>
        ) : dataError ? (
          <p className="text-red-500">{dataError}</p>
        ) : topics.length === 0 ? (
          <p>No topics available</p>
        ) : (
          <div className="flex flex-col gap-2">
            {topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => handleTopicSelect(topic.id)}
                className="p-2 cursor-pointer hover:bg-gray-100 rounded"
              >
                {topic.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )}

  if (isLoading) {
    return (
      <div className="flex items-center w-full min-h-60 bg-white rounded-xl justify-center h-full">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-100 rounded-xl p-4 max-md:p-3 flex flex-col gap-5 max-md:gap-3 bg-white">
      <div className="top flex items-center gap-2 justify-between">
        <div
          onMouseEnter={toggleProfileOpen}
          onMouseLeave={toggleProfileOpen}
          className="flex items-center relative gap-2"
        >
          {isProfileOpen ? (
            <div className="w-50 flex flex-col p-4 gap-2 h-auto absolute top-[30px] z-2 left-0 bg-white border border-gray-200 rounded-lg">
              <div className="w-full flex items-center justify-between">
                <div
                  className="avatar w-10 h-10 overflow-hidden rounded-full bg-gray-200 cursor-pointer"
                  onClick={navToProfile}
                >
                  <img
                    src={profileImageSrc}
                    className="w-full h-full object-cover"
                    alt="profilePicture"
                  />
                </div>
                <button
                  onClick={toggleFollow}
                  disabled={isFollowingLoading || isSelf}
                  className={`py-1 px-2 text-xs cursor-pointer rounded font-bold disabled:opacity-50 disabled:pointer-events-none ${
                    isFollowing ? 'bg-gray-200 text-black' : 'bg-[#FFD30F] text-black'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
              <h2 className="font-bold text-md">{props.author}</h2>
              <p className="text-xs font-bold">
                <strong>{formatFollowerCount(followerCount)}</strong> Followers
              </p>
            </div>
          ) : null}
          <div
            className="avatar w-10 h-10 max-md:w-8 max-md:h-8 overflow-hidden rounded-full bg-gray-200 cursor-pointer"
            onClick={navToProfile}
          >
            <img
              src={profileImageSrc}
              className="w-full h-full object-cover"
              alt="profilePicture"
            />
          </div>
          <div className="name flex items-center flex gap-2 max-md:gap-1">
            <p className="text-sm max-sm:text-xs max-md:text-xs font-bold">{props.author}</p>
            <p className="text-xs text-gray-500">in</p>
            <p className="text-sm max-sm:text-xs max-md:text-xs max-sm:hidden font-bold">
              {props.institution}
            </p>
            <div className="line w-1 h-1 rounded-full bg-gray-500" />
            <p className="text-xs max-md:text-[10px] text-gray-500">{props.time}</p>
          </div>
        </div>
        <div className="more relative">
          <div
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className="items-center p-1 gap-1 flex cursor-pointer"
          >
            <div className="line w-1 h-1 rounded-full bg-gray-500" />
            <div className="line w-1 h-1 rounded-full bg-gray-500" />
            <div className="line w-1 h-1 rounded-full bg-gray-500" />
          </div>
          {isMoreOpen ? (
            props.isSingleUser ? (
              <div className="w-50 z-2 h-auto p-8 max-md:p-4 right-0 absolute top-3 border border-gray-200 rounded-lg bg-white flex gap-3 flex-col">
                <div className="cursor-pointer" onClick={() => openFlow("edit")}>
                  <DynamicRow icon={<EditSVG size={20} />} text="Edit Post" />
                </div>
                <div className="cursor-pointer" onClick={toggleCopied}>
                  <DynamicRow
                    icon={<CopyLinkSVG size={20} />}
                    text="Copy Post Link"
                  />
                </div>
                <div className="cursor-pointer" onClick={() => openFlow("delete")}>
                  <DynamicRow
                    icon={<DeleteSVG size={20} />}
                    text="Delete Post"
                  />
                </div>
                {
                  isCopied ? <div className="w-full p-2 text-xs font-bold bg-white absolute bottom-[-50px] border border-gray-200 rounded-lg left-0">Post Copied</div> : null
                }
              </div>
            ) : (
              <div className="w-50 z-2 h-auto p-5 max-md:p-3 right-0 absolute top-3 border border-gray-200 rounded-lg bg-white flex gap-3 flex-col">
                <div className={`cursor-pointer ${isSelf ? 'opacity-50 pointer-events-none' : ''}`} onClick={isSelf ? undefined : toggleFollow}>
                  <DynamicRow
                    icon={ isFollowing ?
                    <MinusCircle size={20} />
                      :
                      <FollowPlus size={20} />
                  }
                    text={isFollowing ? "Unfollow Author" : "Follow Author"}
                  />
                </div>
                <div className="cursor-pointer" onClick={toggleCopied}>
                  <DynamicRow
                    icon={<CopyLinkSVG size={20} />}
                    text="Copy Post Link"
                  />
                </div>
                {
                  isCopied ? <div className="w-full p-2 text-xs font-bold bg-white absolute bottom-[-50px] border border-gray-200 rounded-lg left-0">Post Copied</div> : null
                }
              </div>
            )
          ) : null}
        </div>
      </div>
      <div className="middle-text my-2">
        <Link to={`/comments/${props.id}`} className="block cursor-pointer"> 
          <p 
            className="text-sm max-md:text-xs line-clamp-5" 
          >
            {props.description}
          </p>
        </Link>
      </div>
      {props.image && (
        <div className="img w-full bg-gray-200">
          <img
            src={props.image}
            alt="content"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="interactions flex items-center justify-between">
        <div className="left flex items-center gap-2 max-md:gap-1">
          <div className="like flex relative items-center gap-1">
            <div onClick={toggleLike} className="cursor-pointer">
              <LikeSVG size={15} color={liked ? "#68049B" : "#544D58"} />
            </div>
            <p
              onClick={() => {
                if (!isAuthenticated || !user?.id) {
                  console.log('Unauthenticated user attempted to view likes, redirecting to /login');
                  navigate('/login');
                  return;
                }
                setIsLikeOpen(!isLikeOpen);
              }}
              className="text-xs max-md:text-[10px] cursor-pointer text-gray-500"
            >
              {likesCount}
            </p>
            {isLikeOpen ? (
              <div className="w-80 p-8 max-md:p-4 flex flex-col gap-2 absolute bottom-[-250px] z-8 left-0 rounded-xl bg-white border border-gray-200 h-80">
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
            ) : null}
          </div>
          <div
            onClick={navigateToComment}
            className="comment flex cursor-pointer items-center gap-1"
          >
            <CommentSVG size={15} />
            <p className="text-xs max-md:text-[10px] text-gray-500">{props.comments}</p>
          </div>

        </div>
        <div className="right flex relative items-center gap-2 max-md:gap-1">
          <div onClick={toggleSave} className="cursor-pointer">
            <BookmarkSVG size={15} color={saved ? "#68049B" : "#544D58"} />
          </div>
          <div
            className="cursor-pointer"
            onClick={() => setIsShareOpen(!isShareOpen)}
          >
            <ShareSVG size={15} />
          </div>
          {isShareOpen ? (
            <div className="w-55 h-40 p-5 max-md:p-3 right-0 z-2 absolute top-3 border border-gray-200 rounded-lg bg-white flex gap-3 flex-col">
              <div className="cursor-pointer" onClick={handleCopyLink}>
                <DynamicRow
                  icon={<CopyLinkSVG size={20} />}
                  text="Copy Post Link"
                />
              </div>
              <div className="cursor-pointer" onClick={shareOnInstagram}>
                <DynamicRow
                  icon={<IGSVG color="#544D58" size={20} />}
                  text="Share On Instagram"
                />
              </div>
              <div className="cursor-pointer" onClick={shareOnFacebook}>
                <DynamicRow
                  icon={<FbSVG color="#544D58" size={20} />}
                  text="Share On Facebook"
                />
              </div>
              <div className="cursor-pointer" onClick={shareOnTwitter}>
                <DynamicRow
                  icon={<XSVG color="#544D58" size={14} />}
                  text="Share On Twitter"
                />
              </div>
              {
                isCopied ? <div className="w-full p-2 text-xs font-bold bg-white absolute bottom-[-50px] border border-gray-200 rounded-lg left-0">Post Copied</div> : null
              }
            </div>
          ) : null}
              
        </div>
      </div>
      <Modal isOpen={!!flow} onClose={closeModal}>
        {renderModalContent()}
      </Modal>
      <Modal isOpen={isOverlayOpen} onClose={toggleReportOverlay}>
        <div className="w-full flex flex-col gap-3">
          <h2 className="text-lg font-bold mb-2">Report Post</h2>
          <p className="font-bold">What issue are you reporting?</p>
          <div className="w-full h-[1px] bg-gray-200 mt-5"></div>
          <button
            onClick={toggleRS}
            className="w-full py-2 bg-[#FFD30F] cursor-pointer mb-5 rounded font-bold disabled:opacity-50 text-white"
          >
            Continue
          </button>
        </div>
        {isRSubmit ? (
          <div className="w-full rounded-lg p-2 bg-white absolute bottom-[-50px] left-0 flex items-center justify-between">
            <p className="text-xs font-bold">Report Submitted</p>
            <div className="cursor-pointer" onClick={closeRS}>
              <CloseSVG size={15} />
            </div>
          </div>
        ) : null}
      </Modal>
      <AlertMessage open={alertOpen} onClose={() => setAlertOpen(false)} severity="purple" message={alertMsg} />
    </div>
  );
};

export default ContentCard;