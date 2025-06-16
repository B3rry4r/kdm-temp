import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { searchQuery } = useSearch();
  const { refreshKey } = usePostUpdate();
  const loadedPostIds = useRef<Set<number>>(new Set());
  const isInitialLoad = useRef(true);

  // Helper to check if user exists in localStorage
  const isUserInLocalStorage = (): boolean => {
    const storedUser = localStorage.getItem('user');
    return !!storedUser && storedUser !== 'null' && storedUser !== 'undefined';
  };

  // Fetch ads - only once
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
  }, []); // Remove apiClient dependency to prevent re-fetching

  // Fetch posts function - fixed dependencies
  const fetchPosts = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    console.log(`fetchPosts called - page: ${pageNum}, isRefresh: ${isRefresh}, isLoadingMore: ${isLoadingMore}, hasMore: ${hasMore}`);
    
    // Prevent multiple simultaneous requests
    if (!isRefresh && (isLoadingMore || !hasMore)) {
      console.log('Request blocked - already loading or no more data');
      return;
    }
    
    if (isRefresh) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // Determine endpoint based on authentication and localStorage
      const endpoint = isAuthenticated && isUserInLocalStorage() ? '/posts' : '/posts/public';
      console.log(`Fetching posts from ${endpoint} (page: ${pageNum})`);

      const response = await apiClient.get<PaginatedPostsResponse>(endpoint, {
        params: { page: pageNum, perPage: 10 },
      });
      
      console.log(`GET ${endpoint} response:`, {
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
        data_length: response.data.data.length
      });

      // Process posts
      const newPosts = response.data.data.map((post) => ({
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
            ? `${post.user.profile_picture}?t=${Date.now()}`
            : null,
          userId: post.user_id.toString(),
        },
      }));

      if (isRefresh) {
        // Reset everything on refresh
        loadedPostIds.current.clear();
        newPosts.forEach(post => loadedPostIds.current.add(parseInt(post.data.id)));
        setContent(newPosts);
        setPage(response.data.current_page + 1);
      } else {
        // Filter duplicates for pagination
        const uniquePosts = newPosts.filter(post => 
          !loadedPostIds.current.has(parseInt(post.data.id))
        );
        
        // Add new post IDs to tracking set
        uniquePosts.forEach(post => loadedPostIds.current.add(parseInt(post.data.id)));
        
        console.log(`Adding ${uniquePosts.length} unique posts out of ${newPosts.length} total`);
        
        if (uniquePosts.length > 0) {
          setContent(prevContent => [...prevContent, ...uniquePosts]);
        }
        setPage(response.data.current_page + 1);
      }
      
      // Update hasMore based on current page vs last page
      const newHasMore = response.data.current_page < response.data.last_page;
      setHasMore(newHasMore);
      console.log(`hasMore set to: ${newHasMore} (current: ${response.data.current_page}, last: ${response.data.last_page})`);
      
    } catch (err: any) {
      console.error('API Error:', err.response?.data || err.message);
      setError('Failed to load posts. Please try again.');
    } finally {
      if (isRefresh) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [apiClient, isAuthenticated]); // Removed isLoadingMore and hasMore from dependencies

  // Initial fetch - only once
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      console.log('Initial fetch triggered');
      fetchPosts(1, true);
    }
  }, [fetchPosts]);

  // Refresh on refreshKey change
  useEffect(() => {
    if (!isInitialLoad.current) { // Skip if it's the initial load
      console.log('Refresh triggered by refreshKey change');
      setPage(1);
      setHasMore(true);
      fetchPosts(1, true);
    }
  }, [refreshKey, fetchPosts]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isLoadingMore || !hasMore || isLoading) {
        return;
      }
      
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const threshold = 100;
      
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        console.log('Scroll threshold reached, fetching more posts...');
        fetchPosts(page);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [page, isLoadingMore, hasMore, isLoading, fetchPosts]);

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

    return content.filter((post) => {
      const postContent = post.data.description?.toLowerCase() || '';
      const authorName = post.data.author?.toLowerCase() || '';
      const topicName = post.data.institution?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();

      return postContent.includes(query) || authorName.includes(query) || topicName.includes(query);
    });
  }, [content, searchQuery]);

  console.log('Render state:', { 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    contentLength: content.length, 
    filteredPostsLength: filteredPosts.length,
    page 
  });

  return (
    <div className="h-full">
      <div className="flex h-full w-full">
        <div
          ref={containerRef}
          className="flex flex-col gap-5 overflow-y-auto p-10 max-xl:p-8 max-lg:p-6 max-md:p-4 flex-4 max-sm:w-full"
        >
          {error && (
            <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">
              {error}
              <button 
                onClick={() => {
                  setError(null);
                  fetchPosts(1, true);
                }}
                className="ml-2 text-blue-500 underline"
              >
                Retry
              </button>
            </div>
          )}

          {searchQuery && (
            <div className="my-3">
              <p className="text-sm">
                Showing results for: <span className="font-semibold">{searchQuery}</span>
              </p>
            </div>
          )}

          {/* Show initial loader only when loading first time and no content */}
          {isLoading && content.length === 0 ? (
            <div className="w-full h-64 flex items-center justify-center">
              <div className="loader"></div>
            </div>
          ) : filteredPosts && filteredPosts.length > 0 ? (
            <>
              {filteredPosts.map((item, index) => (
                <React.Fragment key={`post-${item.data.id}-${index}`}>
                  <ContentCard {...item.data} />
                  {(index + 1) % 5 === 0 && index < filteredPosts.length - 1 && (
                    (() => {
                      const selectedAd = getRandomAd(ads);
                      return selectedAd ? <Banner key={`ad-${item.data.id}-${index}`} ad={selectedAd} /> : null;
                    })()
                  )}
                </React.Fragment>
              ))}
              
              {/* Show loading more indicator at the bottom */}
              {isLoadingMore && (
                <div className="w-full py-4 flex items-center justify-center">
                  <div className="loader"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading more posts...</span>
                </div>
              )}
            </>
          ) : (
            !isLoading && (
              <div className="w-full text-center py-8">
                <p className="text-gray-500">
                  {searchQuery ? "No posts found matching your search." : "No posts available."}
                </p>
              </div>
            )
          )}

          {!hasMore && filteredPosts.length > 0 && !isLoadingMore && (
            <div className="text-center text-xs font-bold py-4">
              No more posts to load.
            </div>
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