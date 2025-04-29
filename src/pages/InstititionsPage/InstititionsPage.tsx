import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ContentCard from '../HomePage/HomePageComponents/ContentCard';
import RightSideBar from '../../components/RightSideBar/RightSideBar';
import { FollowPlus, ShareSVG } from '../../assets/icons/icons';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useData } from '../../context/DataContext/DataContext';

// Interface for post response (updated to match API structure)
interface InstitutionPost {
  id: number;
  post_id: number;
  org_id: number;
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

  // Log orgId and institutions
  // console.log('Extracted orgId:', orgId);
  // console.log('Available institutions:', JSON.stringify(institutions, null, 2));

  // Find institution
  const institution = orgId ? institutions.find(i => i.id === parseInt(orgId)) : null;
  console.log(institution);
  const institutionName = institution?.name || 'Unknown Institution';
  const institutionImage = institution?.image || null;
  const institutionBanner = institution?.banner || null;
  const institutionDescription =
    institution?.description ||
    'Welcome!';
  // console.log('Matched institution:', { institutionName, institutionImage, institutionDescription });

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
        // console.log('Membership check full response:', {
        //   status: response.status,
        //   headers: response.headers,
        //   data: JSON.stringify(response.data, null, 2),
        // });
        setInCommunity(response.data.status);
      } catch (err: any) {
        console.error('Error checking membership:', {
          message: err.message,
          response: err.response ? {
            status: err.response.status,
            data: err.response.data,
          } : null,
        });
        setError('Failed to check membership');
      } finally {
        setIsChecking(false);
      }
    };

    checkMembership();
  }, [orgId, isAuthenticated, apiClient]);

  // Fetch posts and members if in community
  useEffect(() => {
    if (!inCommunity || !orgId || !isAuthenticated) return;

    console.log('incommunity');

    const fetchData = async () => {
      try {
        // Fetch posts
        const postsResponse = await apiClient.get<InstitutionPost[]>(`/org/posts/all/${orgId}`);
        console.log('Institution posts response:', JSON.stringify(postsResponse.data, null, 2));
        if (Array.isArray(postsResponse.data)) {
          setPosts(postsResponse.data);
        } else {
          setError('Invalid posts data');
        }

        // Fetch members
        const membersResponse = await apiClient.get<Member[]>(`/org/posts/members/${orgId}`);
        // console.log('Members response:', JSON.stringify(membersResponse.data, null, 2));
        if (Array.isArray(membersResponse.data)) {
          setMembers(membersResponse.data);
        } else {
          setError('Invalid members data');
        }
      } catch (err: any) {
        console.error('Error fetching data:', err.response?.data || err.message);
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
    console.log('Closing modal');
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
      // console.log('Join response:', JSON.stringify(response.data, null, 2));
      if (response.data.success) {
        setInCommunity(true);
        setIsModalOpen(false);
      } else {
        setJoinError(response.data.message || 'Failed to join institution');
      }
    } catch (err: any) {
      console.error('Error joining institution:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
      });
      setJoinError(err.response?.data?.message || 'Invalid code or server error');
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
        heading={institutionName}
        description="Provide Your Institution Code to Join this Group."
        inputPlaceholder="Code"
        buttonText="Join Group"
        width="w-60"
        onButtonClick={handleModalButtonClick}
        isLoading={isJoining}
        error={joinError}
      />
      {inCommunity ? (
        <div className="flex h-full">
          <div className="p-5 flex-[3] flex flex-col gap-10 overflow-y-auto h-full">
            <div className="w-full min-h-[100px] bg-gray-200 rounded-xl">
            {institutionBanner ? (
                  <img src={institutionBanner} alt={institutionName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-300"></div>
                )}
            </div>
            <div className="profile border-b border-b-gray-200 pb-10 max-sm:flex-col flex gap-2">
              <div className="left w-20 h-20 rounded-full overflow-hidden">
                {institutionImage ? (
                  <img src={institutionImage} alt={institutionName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-300"></div>
                )}
              </div>
              <div className="right flex flex-col p-2 gap-2 pr-4">
                <h1 className="text-xl font-bold">{institutionName}</h1>
                <p className="text-xs">{institutionDescription}</p>
                <div className="flex items-center gap-1">
                  <h2 className="font-bold">{members.length || 2000}</h2>
                  <p className="text-[10px]">Members</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center px-8 py-1 bg-gray-200 cursor-default rounded-md gap-2 justify-center">
                    <FollowPlus size={12} />
                    <button className="text-gray-700 text-sm font-bold">Joined</button>
                  </div>
                  <ShareSVG size={12} />
                </div>
              </div>
            </div>
            {posts.length > 0 ? (
              posts.map((postItem) => {
                const post = postItem.post; // Access the nested post object
                return (
                  <ContentCard
                    key={post.id}
                    id={post.id.toString()}
                    userId={post.user_id.toString()}
                    title={post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '')}
                    description={post.content}
                    image={post.image_urls[0] || null}
                    likes={post.likes_count}
                    comments={post.comments_count}
                    shares={0} // Not provided in API response, default to 0
                    author={'Unknown Author'} // User data not provided in API response
                    institution={institutionName} // Use institution name from context
                    time={post.updated_at}
                    profilePicture={null} // User data not provided in API response
                  />
                );
              })
            ) : (
              <p className="text-sm text-gray-500">No posts found for this institution.</p>
            )}
          </div>
          <div className="flex-[3] max-sm:hidden overflow-y-auto h-full">
            <RightSideBar />
          </div>
        </div>
      ) : (
        <div className="p-10 max-sm:p-6 w-full flex flex-col gap-5 overflow-y-scroll">
          <div className="top w-50 max-sm:w-30 h-50 max-sm:h-30 rounded-full overflow-hidden">
            {institutionImage ? (
              <img src={institutionImage} alt={institutionName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-300"></div>
            )}
          </div>
          <h1 className="text-2xl max-sm:mt-4 font-bold mt-10">{institutionName}</h1>
          <div>
            <p className="w-[50%] max-sm:w-full">{institutionDescription}</p>
          </div>
          <div
            onClick={handleJoinGroup}
            className="w-30 max-sm:w-full py-3 flex items-center justify-center cursor-pointer rounded-lg bg-[#FFD30F]"
          >
            <p className="font-bold text-xs">Join Group</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionsPage;