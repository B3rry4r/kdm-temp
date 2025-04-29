import React, { useState, useEffect, useRef } from 'react';
import ContentCard from './HomePageComponents/ContentCard';
import Banner from './HomePageComponents/banner';
import RightSideBar from '../../components/RightSideBar/RightSideBar';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { usePostUpdate } from '../../context/PostUpdateContext/PostUpdateContext';

interface Ad {
  id: number;
  image: string;
  created_at: string;
  type: number;
  link: string;
}

const HomePage = () => {
  const { apiClient } = useAuth();
  const [content, setContent] = useState<Array<{ type: string; data: any }>>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { shouldRefresh } = usePostUpdate();

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
      const response = await apiClient.get('/posts/public', {
        params: { page: pageNum, perPage: 10 },
      });
      console.log('GET /posts/public response:', JSON.stringify(response.data, null, 2));

      const posts = response.data.map((post: any) => {
        const profilePicture = post.user?.profile_picture
          ? `${post.user.profile_picture}?t=${Date.now()}` // Cache-busting
          : null;
        return {
          type: 'content',
          data: {
            id: post.id,
            title: post.content?.split('\n')[0] || 'Post',
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
            profilePicture,
            userId: post.user_id,
          },
        };
      });

      setContent((prevContent) => [...prevContent, ...posts]);
      setPage(pageNum + 1);
      setHasMore(posts.length > 0);
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

  return (
    <div className="flex h-full">
      <div
        ref={containerRef}
        className="p-10 max-sm:w-full max-sm:p-4 max-sm:items-center flex-[4] flex flex-col gap-10 overflow-y-auto h-full"
      >
        {error && (
          <div className="text-red-500 text-center">{error}</div>
        )}
        {content.map((item, index) => (
          <React.Fragment key={index}>
            <ContentCard {...item.data} />
            {(index + 1) % 3 === 0 && ads.length > 0 && (
              // Randomly select one ad to display every 3 posts
              (() => {
                const selectedAd = getRandomAd(ads);
                return selectedAd ? <Banner ad={selectedAd} /> : null;
              })()
            )}
          </React.Fragment>
        ))}
        {isLoading && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="loader"></div>
          </div>
        )}
        {!hasMore && content.length > 0 && (
          <div className="text-center text-xs font-bold">No more posts to load.</div>
        )}
      </div>
      <div className="flex-[3] max-sm:hidden overflow-y-auto h-full">
        <RightSideBar />
      </div>
    </div>
  );
};

export default HomePage;