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
import { useState } from "react";
import { DynamicRow } from "../../pages/MyCoursesPage/SingleCousre/MySingleCourse";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../../pages/Registration/Modal";
import { Image as ImageIcon, Smile } from "lucide-react";
import { usePostUpdate } from "../../context/PostUpdateContext/PostUpdateContext";


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
  const navigate = useNavigate();

  const toggleNotifications = () => setIsNotificationOpen(!isNotificationOpen);
  const toggleUser = () => setIsUserOpen(!isUserOpen);
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
    setSelectedTopicId(1);
    setIsCreateOpen(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setImages((prev) => [...prev, ...Array.from(files)]);
    }
  };
  
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTopicSelect = (topicId: number) => {
    setSelectedTopicId(topicId);
    setIsTopicSelectorOpen(false);
  };
  
  const handlePostSubmit = async () => {
    if (!postContent.trim()) {
      alert("Post content cannot be empty");
      return;
    }

    if (!user || !user.id) {
      alert("User not authenticated");
      return;
    }

    if (!selectedTopicId) {
      alert("Please select a topic");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("user_id", user.id.toString());
      formData.append("topic_id", selectedTopicId.toString());
      formData.append("content", postContent);

      images.forEach((image) => {
        formData.append("images[]", image);
      });

      const response = await apiClient.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log(JSON.stringify(response));
      
      // ✅ Trigger a refresh across all pages listening to PostUpdateContext
      triggerRefresh();

      // ✅ Reset local UI
      setPostContent("");
      setImages([]);
      setSelectedTopicId(1);
      setIsCreateOpen(false);
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post. Please try again.");
    }
  };

  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId);

  return (
    <div className="flex justify-between items-center max-sm:pr-4 max-sm:z-40 max-sm:w-full max-sm:px-2 absolute top-0 left-0 right-0 bg-white z-10 p-1 px-20 pr-32">
      <Link to={"/"}>
        <div className="w-50 max-sm:h[60px] bg-gray">
          <img src={logo} alt="logo" className="object-cover max-sm:w-40 max-sm:ml-6" />
        </div>
      </Link>
      <div className="search_bar max-sm:mr-1 flex max-sm:w-8 max-sm:h-8 max-sm:rounded-full items-center max-sm:bg-white bg-gray-100 rounded-md w-100">
        <div className="w-10 h-10 max-sm:p-1 rounded-md flex items-center justify-center">
          <img src={search} alt="search" className="object-cover" />
        </div>
        <input
          type="text"
          placeholder="Search something"
          className="w-full text-sm p-2 max-sm:hidden outline-none"
        />
      </div>
      {isAuthenticated ? (
        <div className="btn flex relative items-center gap-3">
          <div
            onClick={() => setIsCreateOpen(!isCreateOpen)}
            className="bg-[#FFD30F] max-sm:px-2 max-sm:rounded-full cursor-pointer rounded-md flex items-center gap-2 justify-center p-2 px-6"
          >
            <PlusSVG2 size={12} />
            <p className="text-sm font-bold max-sm:hidden">Create Post</p>
          </div>
          <div onClick={toggleNotifications} className="hidden cursor-pointer">
            <NotificationSVG />
          </div>
          <div
            onClick={toggleUser}
            className="cursor-pointer rounded-full flex items-center justify-center max-sm:w-7 max-sm:h-7 w-10 h-10 bg-[#68049B] text-white overflow-hidden"
          >
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <p className="text-sm font-bold max-sm:text-xs">{getInitials()}</p>
            )}
          </div>
          {isNotificationOpen ? (
            <div className="flex flex-col max-sm:w-80 w-110 bg-white min-h-50 p-10 absolute right-0 top-15 border border-gray-200 rounded-xl">
              <div className="flex border-b border-gray-200 pb-5 items-center justify-between">
                <h1 className="font-bold text-xl">Notifications</h1>
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
            <div className="flex flex-col w-70 bg-white min-h-50 absolute right-0 top-15 border border-gray-200 rounded-xl">
              <div className="flex flex-col gap-3 border-b border-gray-200 p-10 items-center justify-between">
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
              <div className="flex flex-col gap-3 border-b border-gray-200 px-10 py-6 justify-between">
                <p onClick={navToRefer} className="cursor-pointer py-0 px-2 text-xs font-bold">
                  Refer a friend
                </p>
              </div>
              <div onClick={logout} className="py-5 px-10 cursor-pointer">
                <DynamicRow icon={<LogOutSVG size={20} />} text="Logout" />
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="btn flex items-center cursor-pointer gap-1">
          <Link to={'/login'}>
            <div className="login max-sm:hidden bg-gray-100 rounded-md p-2 px-6">
              <p className="text-sm font-bold">Login</p>
            </div>
          </Link>
          <Link to={'/login'}>
            <div className="signup cursor-pointer rounded-md p-2 bg-[#FFD30F] px-6">
              <p className="text-sm font-bold">Signup</p>
            </div>
          </Link>
        </div>
      )}
      <Modal isOpen={isCreateOpen} onClose={clearPostModalState}>
        <div className="w-full flex flex-col gap-3">
          <h1 className="font-bold text-xl">Create Post</h1>

          <div
            onClick={toggleTopicSelector}
            className="font-bold text-xs py-2 px-2 bg-gray-200 w-30 rounded-lg cursor-pointer"
          >
            {dataLoading ? "Loading..." : dataError ? "Error" : selectedTopic?.name || "Select Topic"}
          </div>

          <div className="bg-white p-2 flex flex-col items-end rounded-xl">
            <textarea
              className="w-full h-[50px] p-2 resize-none text-[10px] outline-none"
              placeholder="Type your message..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
            ></textarea>

            {/* Image Preview Section */}
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
                    >
                      <CloseSVG color={'gray'} size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Icon Row */}
            <div className="flex border-b border-gray-300 w-full justify-between items-center p-2 mt-2">
              <div className="flex gap-2">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <ImageIcon size={16} />
                </label>
                <Smile size={16} className="cursor-pointer" />
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
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

export default Header;