import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ContentCard from '../HomePage/HomePageComponents/ContentCard';
import RightSideBar from '../../components/RightSideBar/RightSideBar';
import { FollowPlus, ShareSVG } from '../../assets/icons/icons';
import Modal from '../../pages/Registration/Modal';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useData } from '../../context/DataContext/DataContext';
import AlertMessage from '../../components/AlertMessage';

// Interface for post response (updated to match API structure)
interface InstitutionPost {
  id: number;
  post_id: number;
  org_id: number;
  name: string;
  profile_picture: string;
  post: {
    id: number;
    user_id: number;
    topic_id: number;
    content: string;
    video: string | null;
    updated_at: string;
    type: number;
    image_urls: string[];
    liked: boolean;
    saved: boolean;
    likes_count: number;
    comments_count: number;
  };
}

// Interface for member response
interface Member {
  id: number;
  firstname: string;
  lastname: string;
  profile_picture: string | null;
  is_following: boolean;
}

// Interface for membership check response
interface MembershipCheck {
  status: boolean;
}

// Interface for join response
interface JoinResponse {
  success: boolean;
  message?: string;
}

const InstitutionsPage = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const { apiClient, isAuthenticated } = useAuth();
  const { institutions } = useData();
  const [inCommunity, setInCommunity] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posts, setPosts] = useState<InstitutionPost[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  // Find institution
  const institution = orgId ? institutions.find(i => i.id === parseInt(orgId)) : null;
  const institutionName = institution?.name || 'Unknown Institution';
  const institutionImage = institution?.image || null;
  const institutionBanner = institution?.banner || null;
  const institutionDescription =
    institution?.description ||
    'Welcome!';

  // Check membership
  useEffect(() => {
    const checkMembership = async () => {
      if (!isAuthenticated || !orgId) {
        setError('Invalid institution ID or not authenticated');
        setIsChecking(false);
        return;
      }

      try {
        const response = await apiClient.get<MembershipCheck>(`/org/posts/user/check/${orgId}`);
        console.log('Membership check response:', response.data);
        
        if (response.data && typeof response.data.status === 'boolean') {
          setInCommunity(response.data.status);
          console.log('Membership status:', response.data.status ? 'Member' : 'Not a member');
        } else {
          console.error('Invalid membership check response:', response.data);
          setInCommunity(false);
        }
      } catch (err: any) {
        console.error('Membership check error:', err.response?.data || err);
        setError('Failed to check membership');
        setInCommunity(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkMembership();
  }, [orgId, isAuthenticated, apiClient]);

  // Fetch posts and members if in community
  useEffect(() => {
    if (!inCommunity || !orgId || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        // Fetch posts
        const postsResponse = await apiClient.get<InstitutionPost[]>(`/org/posts/all/${orgId}`);
        if (Array.isArray(postsResponse.data)) {
          setPosts(postsResponse.data);
        } else {
          setError('Invalid posts data');
        }

        // Fetch members
        const membersResponse = await apiClient.get<Member[]>(`/org/posts/members/${orgId}`);
        if (Array.isArray(membersResponse.data)) {
          setMembers(membersResponse.data);
        } else {
          setError('Invalid members data');
        }
      } catch (err: any) {
        setError('Failed to load posts or members');
      }
    };

    fetchData();
  }, [inCommunity, orgId, isAuthenticated, apiClient]);

  const handleJoinGroup = () => {
    setIsModalOpen(true);
    setJoinError(null); // Clear previous errors
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setJoinError(null);
  };

  const handleModalButtonClick = async (code: string) => {
    if (!orgId || !code.trim()) {
      setJoinError('Please enter a valid code');
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const response = await apiClient.post<JoinResponse>('/org/posts/join', {
        org_id: parseInt(orgId),
        code,
      });
      
      console.log('Join response:', response.data);
      
      if (response.data.success) {
        setInCommunity(true);
        setIsModalOpen(false);
        setAlertMsg(`Successfully joined ${institutionName}`);
        setAlertOpen(true);
        
        // Refresh the page to update UI with new community access
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setJoinError(response.data.message || 'Failed to join institution');
      }
    } catch (err: any) {
      console.error('Join error:', err.response?.data || err);
      setJoinError(err.response?.data?.message || 'Invalid code or server error');
      
      // If the error is due to already being a member, update the state
      if (err.response?.data?.message?.includes('already a member')) {
        setInCommunity(true);
        setIsModalOpen(false);
        setAlertMsg(`You are already a member of ${institutionName}`);
        setAlertOpen(true);
      }
    } finally {
      setIsJoining(false);
    }
  };

  if (isChecking) {
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
    <div className="h-full">
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        width="w-96 max-sm:w-[90%] max-md:w-[80%]"
      >
        <div className="p-4 flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4">Join {institutionName}</h2>
          <p className="text-sm text-gray-600 mb-4">
            Enter the institution code to join {institutionName}.
          </p>
          <input
            type="text"
            placeholder="Enter code"
            className="w-full p-2 border rounded-md mb-4"
            onChange={() => setJoinError(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleModalButtonClick((e.target as HTMLInputElement).value);
              }
            }}
            id="institution-code-input"
          />
          {joinError && <p className="text-red-500 text-sm mb-4">{joinError}</p>}
          <button
            onClick={() => {
              const codeInput = document.getElementById('institution-code-input') as HTMLInputElement;
              handleModalButtonClick(codeInput.value);
            }}
            disabled={isJoining}
            className="bg-[#FFD30F] text-black py-2 px-4 rounded-md font-bold"
          >
            {isJoining ? 'Joining...' : 'Join'}
          </button>
        </div>
      </Modal>
      <AlertMessage open={alertOpen} message={alertMsg} severity="purple" onClose={() => setAlertOpen(false)} />
      {inCommunity ? (
        <div className="flex h-full">
          <div className="p-5 max-md:p-3 flex-[4] flex flex-col gap-10 max-md:gap-6 overflow-y-auto h-full">
            <div className="w-full min-h-[100px] max-md:min-h-[80px] bg-gray-200 rounded-xl">
            {institutionBanner ? (
                  <img src={institutionBanner} alt={institutionName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-300"></div>
                )}
            </div>
            <div className="profile border-b border-b-gray-200 pb-10 max-sm:pb-6 max-md:pb-8 max-sm:flex-col flex gap-2 max-md:gap-3">
              <div className="left w-20 h-20 max-md:w-16 max-md:h-16 rounded-full overflow-hidden">
                {institutionImage ? (
                  <img src={institutionImage} alt={institutionName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-300"></div>
                )}
              </div>
              <div className="right flex flex-col p-2 gap-2 pr-4">
                <h1 className="text-xl max-md:text-lg font-bold">{institutionName}</h1>
                <p className="text-xs max-md:text-[10px]">{institutionDescription}</p>
                <div className="flex items-center gap-1">
                  <h2 className="font-bold">{members.length || 2000}</h2>
                  <p className="text-[10px]">Members</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center px-8 max-md:px-4 py-1 bg-gray-200 cursor-default rounded-md gap-2 justify-center">
                    <FollowPlus size={12} />
                    <button className="text-gray-700 text-sm max-md:text-xs font-bold">Joined</button>
                  </div>
                  <ShareSVG size={12} />
                </div>
              </div>
            </div>
            {posts.length > 0 ? (
              posts.map((postItem) => {
                const post = postItem; // Access the nested post object
                return (
                  <ContentCard
                    key={post.id}
                    id={post.id.toString()}
                    userId={post.post.user_id.toString()}
                    title={post.post.content.substring(0, 50) + (post.post.content.length > 50 ? '...' : '')}
                    description={post.post.content}
                    image={post.post.image_urls[0] || null}
                    likes={post.post.likes_count}
                    comments={post.post.comments_count}
                    shares={0} // Not provided in API response, default to 0
                    author={post.name} // User data not provided in API response
                    institution={institutionName} // Use institution name from context
                    time={post.post.updated_at}
                    profilePicture={post.profile_picture} // User data not provided in API response
                  />
                );
              })
            ) : (
              <p className="text-sm text-gray-500">No posts found for this institution.</p>
            )}
          </div>
          <div className="flex-[3] max-lg:hidden max-md:flex-[2] max-sm:hidden overflow-y-auto h-full">
            <RightSideBar  />
          </div>
        </div>
      ) : (
        <div className="p-10 max-sm:p-6 max-md:p-8 w-full flex flex-col gap-5 overflow-y-scroll">
          <div className="top w-50 max-sm:w-30 max-md:w-40 h-50 max-sm:h-30 max-md:h-40 rounded-full overflow-hidden">
            {institutionImage ? (
              <img src={institutionImage} alt={institutionName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-300"></div>
            )}
          </div>
          <h1 className="text-2xl max-sm:mt-4 max-md:text-xl font-bold mt-10 max-md:mt-6">
            {institutionName}
          </h1>
          <div>
            <p className="w-[50%] max-sm:w-full max-md:w-[70%] max-lg:w-[60%]">
              {institutionDescription}
            </p>
          </div>
          <div
            onClick={handleJoinGroup}
            className="w-30 max-sm:w-full max-md:w-40 py-3 flex items-center justify-center cursor-pointer rounded-lg bg-[#FFD30F]"
          >
            <p className="font-bold text-xs">Join Group</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionsPage;