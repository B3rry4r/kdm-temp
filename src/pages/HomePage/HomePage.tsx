import React, { useState, useEffect, useRef, useMemo } from 'react';
import ContentCard from './HomePageComponents/ContentCard';
import Banner from './HomePageComponents/banner';
import RightSideBar from '../../components/RightSideBar/RightSideBar';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { usePostUpdate } from '../../context/PostUpdateContext/PostUpdateContext';
import { useSearch } from '../../components/header/Header';

// Interface for ad response
interface Ad {
  id: number;
  image: string;
  created_at: string;
  type: number;
  link: string;
}

// Interface for paginated posts response
interface PaginatedPostsResponse {
  current_page: number;
  data: Array<{
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
    topic: {
      id: number;
      name: string;
      logo: string;
      banner: string;
      follower_count: number;
      is_user_following: boolean;
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
      is_active: boolean;
    };
  }>;
  last_page: number;
  per_page: number;
  total: number;
}

const HomePage = () => {
  const { apiClient, isAuthenticated } = useAuth();
  const [content, setContent] = useState<Array<{ type: string; data: any }>>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { searchQuery } = useSearch();

  const { shouldRefresh } = usePostUpdate();

  // Helper to check if user exists in localStorage
  const isUserInLocalStorage = (): boolean => {
    const storedUser = localStorage.getItem('user');
    return !!storedUser && storedUser !== 'null' && storedUser !== 'undefined';
  };

  // Fetch ads
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await apiClient.get<Ad[]>('/ad/home/one/get');
        console.log('GET /ad/home/one/get response:', JSON.stringify(response.data, null, 2));
        setAds(response.data || []);
      } catch (err: any) {
        console.error('Failed to load ads:', err.response?.data || err.message);
        setAds([]);
      }
    };
    fetchAds();
  }, [apiClient]);

  // Watch for refresh trigger
  useEffect(() => {
    if (shouldRefresh) {
      setContent([]);
      setPage(1);
      setHasMore(true);
      fetchPosts(1);
    }
  }, [shouldRefresh]);

  const fetchPosts = async (pageNum: number) => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setError(null);

    try {
      // Determine endpoint based on authentication and localStorage
      const endpoint = isAuthenticated && isUserInLocalStorage() ? '/posts' : '/posts/public';
      console.log(`Fetching posts from ${endpoint} (page: ${pageNum})`);

      const response = await apiClient.get<PaginatedPostsResponse>(endpoint, {
        params: { page: pageNum, perPage: 10 },
      });
      console.log(`GET ${endpoint} response:`, JSON.stringify(response.data, null, 2));

      const posts = response.data.data.map((post) => ({
        type: 'content',
        data: {
          id: post.id.toString(),
          title: post.content?.split('\n')[0]?.substring(0, 50) || 'Post',
          description: post.content || '',
          image: post.image_urls && post.image_urls.length > 0 ? post.image_urls[0] : null,
          likes: post.likes_count || 0,
          author:
            post.user && post.user.firstname && post.user.lastname
              ? `${post.user.firstname} ${post.user.lastname}`
              : 'Unknown Author',
          institution: post.topic && post.topic.name ? post.topic.name : 'Unknown Topic',
          time: post.updated_at || 'Unknown Time',
          comments: post.comments_count ?? 0,
          profilePicture: post.user?.profile_picture
            ? `${post.user.profile_picture}?t=${Date.now()}` // Cache-busting
            : null,
          userId: post.user_id.toString(),
        },
      }));

      setContent((prevContent) => [...prevContent, ...posts]);
      setPage(pageNum + 1);
      setHasMore(response.data.current_page < response.data.last_page);
    } catch (err: any) {
      setError('Failed to load posts. Please try again.');
      console.error('API Error:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1); // Initial fetch
  }, []);

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
  }, [page, isLoading, hasMore]);

  // Function to randomly select an ad
  const getRandomAd = (ads: Ad[]): Ad | null => {
    if (!ads || ads.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * ads.length);
    const selectedAd = ads[randomIndex];
    console.log('Selected random ad:', JSON.stringify(selectedAd, null, 2));
    return selectedAd;
  };

  // Filter posts based on search
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim() || !content || content.length === 0) {
      return content;
    }
    
    return content.filter(post => {
      const content = post.data.description?.toLowerCase() || '';
      const authorName = post.data.author?.toLowerCase() || '';
      const topicName = post.data.institution?.toLowerCase() || '';
      
      const query = searchQuery.toLowerCase();
      
      return content.includes(query) || 
             authorName.includes(query) || 
             topicName.includes(query);
    });
  }, [content, searchQuery]);

  // Fix the duplicate post rendering issue
  return (
    <div className="h-full">
      <div className="flex h-full w-full">
        <div 
          ref={containerRef}
          className="flex flex-col gap-5 overflow-y-auto p-10 max-xl:p-8 max-lg:p-6 max-md:p-4 flex-4 max-sm:w-full"
        >
          {error && (
            <div className="text-red-500 text-center">{error}</div>
          )}
          
          {searchQuery && (
            <div className="my-3">
              <p className="text-sm">
                Showing results for: <span className="font-semibold">{searchQuery}</span>
              </p>
            </div>
          )}
          
          {!isLoading ? (
            filteredPosts && filteredPosts.length > 0 ? (
              filteredPosts.map((item, index) => (
                <React.Fragment key={index}>
                  <ContentCard {...item.data} />
                  {(index + 1) % 5 === 0 && index < filteredPosts.length - 1 && (
                    // Randomly select one ad to display every 5 posts
                    (() => {
                      const selectedAd = getRandomAd(ads);
                      return selectedAd ? <Banner ad={selectedAd} /> : null;
                    })()
                  )}
                </React.Fragment>
              ))
            ) : (
              <div className="w-full text-center py-8">
                <p className="text-gray-500">
                  {searchQuery ? "No posts found matching your search." : "No posts available."}
                </p>
              </div>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="loader"></div>
            </div>
          )}
          
          {!hasMore && filteredPosts.length > 0 && (
            <div className="text-center text-xs font-bold">No more posts to load.</div>
          )}
        </div>
        
        <div className="flex-[3] max-md:flex-[2] max-sm:hidden max-lg:hidden overflow-y-auto h-full">
          <RightSideBar />
        </div>
      </div>
    </div>
  );
};

export default HomePage;