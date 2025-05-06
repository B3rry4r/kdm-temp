import logo from "../../assets/logo_kdm.png";
import search from "../../assets/icons/search.svg";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useData } from "../../context/DataContext/DataContext";
import {
  AccountSVG,
  CloseSVG,
  HelpSVG,
  LogOutSVG,
  NotificationSVG,
  PlusSVG2,
  SettingsSVG,
} from "../../assets/icons/icons";
import NotificationCard from "./components/NotificationCard";
import { useState, useEffect, useContext, createContext, useMemo } from "react";
import { DynamicRow } from "../../pages/MyCoursesPage/SingleCousre/MySingleCourse";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Modal from "../../pages/Registration/Modal";
import { Image as ImageIcon, Smile, Search as SearchIcon, ChevronDown } from "lucide-react";
import { usePostUpdate } from "../../context/PostUpdateContext/PostUpdateContext";
import imageCompression from "browser-image-compression";
import { useAlert } from '../../context/AlertContext/AlertContext';
import EmojiPicker from 'emoji-picker-react';

// Create context for search functionality
interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const SearchContext = createContext<SearchContextType>({
  searchQuery: '',
  setSearchQuery: () => {},
});

export const useSearch = () => useContext(SearchContext);

const Header = () => {
  const { triggerRefresh } = usePostUpdate();
  const { isAuthenticated, user, logout, apiClient } = useAuth();
  const { topics, loading: dataLoading, error: dataError } = useData();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTopicSelectorOpen, setIsTopicSelectorOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(1); // Default to SME Mata
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // Added for preview URLs
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { setSearchQuery } = useSearch();
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const location = useLocation();
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const toggleNotifications = () => setIsNotificationOpen(!isNotificationOpen);
  const toggleUser = () => {
    setIsUserOpen(!isUserOpen);
  };
  const toggleTopicSelector = () => setIsTopicSelectorOpen(!isTopicSelectorOpen);

  const navToProfile = () => {
    setIsUserOpen(false);
    navigate(`/user-profile`);
  };

  const navToSettings = () => {
    setIsUserOpen(false);
    navigate(`/settings`);
  };

  const navToRefer = () => {
    setIsUserOpen(false);
    navigate(`/refer`);
  };

  const getInitials = () => {
    if (!user) return "??";
    const firstInitial = user.firstname ? user.firstname.charAt(0).toUpperCase() : "";
    const lastInitial = user.lastname ? user.lastname.charAt(0).toUpperCase() : "";
    return `${firstInitial}${lastInitial}` || "??";
  };

  const clearPostModalState = () => {
    setPostContent("");
    setImages([]);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url)); // Clean up preview URLs
    setImagePreviews([]);
    setSelectedTopicId(1);
    setIsCreateOpen(false);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const compressionOptions = {
          maxSizeMB: 0.5, // Maximum size in MB
          maxWidthOrHeight: 1024, // Maximum width or height
          useWebWorker: true, // Use web worker for better performance
        };

        // Compress each file
        const compressedFiles = await Promise.all(
          Array.from(files).map(async (file) => {
            return await imageCompression(file, compressionOptions);
          })
        );

        // Generate preview URLs for compressed files
        const newPreviews = compressedFiles.map((file) => URL.createObjectURL(file));

        // Update state
        setImages((prev) => [...prev, ...compressedFiles]);
        setImagePreviews((prev) => [...prev, ...newPreviews]);
      } catch (error) {
        console.error("Image compression error:", error);
        alert("Failed to compress images. Please try again.");
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Revoke URL for removed image
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  };

  const handleTopicSelect = (topicId: number) => {
    setSelectedTopicId(topicId);
    setIsTopicSelectorOpen(false);
  };

  const handlePostSubmit = async () => {
    // Validation: Allow post if there's text OR an image
    if (!postContent.trim() && images.length === 0) {
      showAlert("Please enter some text or select an image to post.", "error");
      return;
    }

    if (!user || !user.id) {
      showAlert("User not authenticated", "error");
      return;
    }

    if (!selectedTopicId) {
      showAlert("Please select a topic", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("user_id", user.id.toString());
      formData.append("topic_id", selectedTopicId.toString());

      // Append text content only if it exists
      if (postContent.trim()) {
        formData.append('content', postContent);
      }

      // Append images only if they exist
      images.forEach((image) => {
        formData.append('images[]', image);
      });

      const response = await apiClient.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Trigger a refresh across all pages listening to PostUpdateContext
      triggerRefresh();

      // Show success alert
      console.log(response.data);
      
      showAlert("Post created successfully", "success");

      // Reset local UI
      clearPostModalState();
    } catch (error) {
      console.error("Failed to create post:", error);
      showAlert("Failed to create post. Please try again.", "error");
    }
  };

  // Handle emoji selection
  const onEmojiClick = (emojiObject: { emoji: string }) => {
    setPostContent(prevContent => prevContent + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Clean up preview URLs on component unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId);

  // Function to handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    // Update the global context with a small debounce
    const debounceTimer = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  };

  // Get placeholder text based on current route
  const getSearchPlaceholder = () => {
    const route = location.pathname;
    if (route.includes('/courses')) return 'Search courses...';
    if (route.includes('/institutions')) return 'Search institutions...';
    if (route.includes('/topics')) return 'Search in topic...';
    if (route.includes('/saved-posts')) return 'Search saved posts...';
    if (route.includes('/events')) return 'Search events...';
    return 'Search something...';
  };

  // Toggle mobile search visibility
  const toggleMobileSearch = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  return (
    <div className="flex justify-between items-center max-xl:px-10 max-lg:px-6 max-md:px-10 max-sm:px-10 absolute top-0 left-0 right-0 bg-white z-10 p-1 px-20 pr-32">
      <Link to={"/"}>
        <div className="w-50 max-lg:w-44 max-md:w-40 max-sm:w-36 bg-gray">
          <img src={logo} alt="logo" className="object-cover max-lg:w-40 max-md:w-36 max-sm:w-32" />
        </div>
      </Link>
      
      <div className="search_bar max-xl:w-[250px] max-lg:w-[220px] max-md:w-[180px] flex max-sm:w-8 max-sm:h-8 max-sm:rounded-full items-center max-sm:bg-white bg-gray-100 rounded-md w-[300px]">
        <div 
          className="w-10 h-10 max-md:hidden max-lg:w-9 max-lg:h-9 max-md:w-8 max-md:h-8 max-sm:p-1 rounded-md flex items-center justify-center cursor-pointer"
          onClick={toggleMobileSearch}
        >
          <img src={search} alt="search" className="object-cover" />
        </div>
        
        <input
          type="text"
          placeholder={getSearchPlaceholder()}
          value={localSearchQuery}
          onChange={handleSearchChange}
          className={`w-full text-sm max-md:hidden max-lg:text-xs p-2 outline-none bg-transparent ${isSearchVisible ? 'max-sm:hidden' : ''}`}
        />
        
        {isSearchVisible && (
          <div className="hidden max-sm:flex absolute top-full left-0 right-0 bg-white p-4 z-50 shadow-md">
            <div className="flex items-center w-full bg-gray-100 rounded-md px-3">
              <SearchIcon size={16} className="text-gray-500" />
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={localSearchQuery}
                onChange={handleSearchChange}
                className="w-full text-sm p-2 outline-none bg-transparent"
              />
            </div>
            <button 
              onClick={toggleMobileSearch}
              className="ml-2 text-xs text-gray-500"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {isAuthenticated ? (
        <div className="btn flex relative items-center gap-5 max-lg:gap-2 max-md:gap-1">
           <div 
          className="w-10 h-10 max-lg:w-9 max-lg:h-9 max-md:w-8 max-md:h-8 max-sm:p-1 rounded-md flex items-center justify-center cursor-pointer"
          onClick={toggleMobileSearch}
        >
          <img src={search} alt="search" className="object-cover" />
        </div>
          <div
            onClick={() => setIsCreateOpen(!isCreateOpen)}
            className="bg-[#FFD30F] max-lg:px-4 max-lg:py-1.5 max-md:px-3 max-sm:px-2 max-sm:py-1.5 max-sm:rounded-full cursor-pointer rounded-md flex items-center gap-2 justify-center p-2 px-6"
          >
            <PlusSVG2 size={12} />
            <p className="text-sm font-bold max-lg:text-xs max-md:text-[10px] max-sm:hidden">Create Post</p>
          </div>
          <div onClick={toggleNotifications} className="hidden cursor-pointer">
            <NotificationSVG />
          </div>
          <div
            onClick={toggleUser}
            className="cursor-pointer ml-2 rounded-full flex items-center justify-center max-sm:w-7 max-sm:h-7 max-md:w-8 max-md:h-8 max-lg:w-9 max-lg:h-9 w-10 h-10 bg-[#68049B] text-white overflow-hidden"
          >
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <p className="text-sm font-bold max-lg:text-xs max-md:text-xs max-sm:text-[10px]">{getInitials()}</p>
            )}
          </div>
          {isNotificationOpen ? (
            <div className="flex flex-col max-sm:w-[calc(100vw-40px)] max-md:w-[280px] max-lg:w-[320px] w-[350px] bg-white min-h-50 max-lg:p-6 max-md:p-4 p-10 absolute right-0 top-15 border border-gray-200 rounded-xl z-50">
              <div className="flex border-b border-gray-200 pb-5 items-center justify-between">
                <h1 className="font-bold text-xl max-lg:text-lg max-md:text-base max-sm:text-sm">Notifications</h1>
                <div onClick={toggleNotifications} className="cursor-pointer">
                  <CloseSVG size={15} />
                </div>
              </div>
              <NotificationCard test="John Doe" />
              <NotificationCard test="John Doe" />
              <NotificationCard test="John Doe" />
            </div>
          ) : null}
          {isUserOpen ? (
            <div className="flex flex-col max-sm:w-[calc(100vw-70px)] max-md:w-[250px] max-lg:w-[280px] w-[300px] bg-white min-h-50 absolute right-0 top-15 border border-gray-200 rounded-xl z-50">
              <div className="flex flex-col gap-3 border-b border-gray-200 max-lg:p-6 max-md:p-4 p-10 items-center justify-between">
                <div onClick={navToProfile} className="w-full cursor-pointer">
                  <DynamicRow icon={<AccountSVG size={20} />} text="View Profile" />
                </div>
                <div onClick={navToSettings} className="w-full cursor-pointer">
                  <DynamicRow icon={<SettingsSVG size={20} />} text="Settings" />
                </div>
                <div className="w-full cursor-pointer">
                  <DynamicRow icon={<HelpSVG size={20} />} text="Support & Help" />
                </div>
              </div>
              <div className="flex flex-col gap-3 border-b border-gray-200 max-lg:px-6 max-md:px-4 px-10 py-6 justify-between">
                <p onClick={navToRefer} className="cursor-pointer py-0 px-2 text-xs font-bold">
                  Refer a friend
                </p>
              </div>
              <div onClick={logout} className="py-5 max-lg:px-6 max-md:px-4 px-10 cursor-pointer">
                <DynamicRow icon={<LogOutSVG size={20} />} text="Logout" />
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="btn flex items-center cursor-pointer gap-2 max-md:gap-1">
          <Link to={'/login'}>
            <div className="login max-md:hidden max-sm:hidden bg-gray-100 rounded-md p-2 px-6 max-lg:px-4 max-lg:py-1.5">
              <p className="text-sm max-lg:text-xs font-bold">Login</p>
            </div>
          </Link>
          <Link to={'/login'}>
            <div className="signup cursor-pointer rounded-md p-2 bg-[#FFD30F] px-6 max-lg:px-4 max-lg:py-1.5 max-md:px-3">
              <p className="text-sm max-lg:text-xs font-bold">Signup</p>
            </div>
          </Link>
        </div>
      )}
      <Modal isOpen={isCreateOpen} onClose={clearPostModalState} width="w-[60%] max-lg:w-[60%] max-md:w-[90%] max-sm:w-[95%]">
        <div className="w-full flex flex-col gap-3">
          <h1 className="font-bold text-xl max-lg:text-lg max-md:text-base max-sm:text-sm">Create Post</h1>

          <div
            onClick={toggleTopicSelector}
            className="font-bold text-xs py-2 px-2 flex items-center gap-2 bg-gray-200 w-30 max-md:w-28 rounded-lg cursor-pointer"
          >
            {dataLoading ? "Loading..." : dataError ? "Error" : selectedTopic?.name || "Select Topic"}
            <ChevronDown size={20} />
          </div>

          <div className="bg-white p-2 flex flex-col items-end rounded-xl">
            <textarea
              className="w-full h-[80px] p-2 resize-none text-md outline-none"
              placeholder="Type your message..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
            ></textarea>

            {/* Image Preview Section */}
            {images.length > 0 && (
              <div className="w-full flex gap-2 overflow-x-auto mt-2">
                {images.map((_, index) => (
                  <div key={index} className="relative w-16 h-16 rounded-md overflow-hidden">
                    <img
                      src={imagePreviews[index]}
                      alt={`preview-${index}`}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-0 right-0 bg-black bg-opacity-60 text-white rounded-full p-1 text-xs"
                    >
                      <CloseSVG color={'gray'} size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Icon Row */}
            <div className="flex gap-2 relative">
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
              />
            </div>

            <button
              onClick={handlePostSubmit}
              className="mt-3 px-5 w-25 py-2 cursor-pointer bg-[#FFD30F] font-bold text-xs rounded-sm"
            >
              Send
            </button>
          </div>
        </div>
      </Modal>

      {isTopicSelectorOpen && (
        <Modal isOpen={isTopicSelectorOpen} onClose={toggleTopicSelector}>
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
    </div>
  );
};

// Create a provider component for search context
export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Create a memoized value to avoid unnecessary re-renders
  const contextValue = useMemo(
    () => ({ searchQuery, setSearchQuery }),
    [searchQuery]
  );

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

export default Header;