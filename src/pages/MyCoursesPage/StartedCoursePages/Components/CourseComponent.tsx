import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { ForwardArrowSVG } from '../../../../assets/icons/icons';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const getYouTubeVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

interface CourseProps {
  title: string;
  description: string;
  videoUrl: string;
  onComplete: () => void;
  onPreviousLesson: () => void;
  onNextLesson: () => void;
}

const CourseComponent: React.FC<CourseProps> = React.memo(({ title, description, videoUrl, onComplete, onPreviousLesson, onNextLesson }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const youtubePlayerDivRef = useRef<HTMLDivElement>(null);
  const [isYouTube, setIsYouTube] = useState(false);
  const [isYouTubeLoading, setIsYouTubeLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const youtubeVideoId = getYouTubeVideoId(videoUrl);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const initializePlayer = useCallback(() => {
    if (!isMounted.current) {
      console.log('Component unmounted, skipping player initialization');
      return;
    }
    if (!youtubeVideoId) {
      console.log('No YouTube video ID, clearing player');
      setIsYouTubeLoading(false);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      return;
    }

    if (!window.YT || !window.YT.Player) {
      console.log('YouTube API not loaded');
      return;
    }

    const playerDiv = youtubePlayerDivRef.current;
    if (!playerDiv) {
      console.error('YouTube player container not found');
      setPlayerError('YouTube player container not found.');
      setIsYouTubeLoading(false);
      return;
    }

    console.log('Creating YouTube player for video ID:', youtubeVideoId);
    setIsYouTubeLoading(true);
    playerRef.current = new window.YT.Player(playerDiv, {
      height: '100%',
      width: '100%',
      videoId: youtubeVideoId,
      playerVars: {
        controls: 1,
        modestbranding: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          if (isMounted.current) {
            console.log('YouTube player ready');
            setPlayerError(null);
            setIsYouTubeLoading(false);
            setIsPlaying(true);
          }
        },
        onStateChange: (event: any) => {
          if (isMounted.current) {
            console.log('YouTube player state:', event.data);
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          }
        },
        onError: (event: any) => {
          if (isMounted.current) {
            console.error('YouTube player error:', event.data);
            setPlayerError(`YouTube error: Code ${event.data}`);
            setIsYouTubeLoading(false);
          }
        },
      },
    });
  }, [youtubeVideoId]);

  useEffect(() => {
    console.log('useEffect for videoUrl:', videoUrl);
    setIsYouTube(!!youtubeVideoId);
    setPlayerError(null);
    setIsYouTubeLoading(!!youtubeVideoId);

    if (youtubeVideoId) {
      console.log('Loading YouTube video ID:', youtubeVideoId);
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        console.log('Injecting YouTube API script');
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.onerror = () => {
          if (isMounted.current) {
            console.error('Failed to load YouTube API script');
            setPlayerError('Failed to load YouTube API');
            setIsYouTubeLoading(false);
          }
        };
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag?.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
      }

      window.onYouTubeIframeAPIReady = () => {
        console.log('onYouTubeIframeAPIReady triggered');
        initializePlayer();
      };

      const timeout = setTimeout(() => {
        if (isMounted.current && isYouTubeLoading && !window.YT?.Player) {
          console.error('YouTube API timeout after 10s');
          setPlayerError('YouTube API failed to load');
          setIsYouTubeLoading(false);
        }
      }, 10000);

      return () => {
        clearTimeout(timeout);
        if (window.onYouTubeIframeAPIReady === initializePlayer) {
          window.onYouTubeIframeAPIReady = undefined;
        }
      };
    } else {
      console.log('Not a YouTube video');
      setIsYouTubeLoading(false);
      setIsPlaying(false);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    }

    return () => {
      console.log('Cleaning up YouTube player');
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.error('Error destroying player:', err);
        }
        playerRef.current = null;
      }
    };
  }, [youtubeVideoId, initializePlayer]);

  const togglePlayPause = () => {
    if (isYouTube && playerRef.current) {
      try {
        const state = playerRef.current.getPlayerState();
        console.log('Toggling YouTube player, state:', state);
        if (state === window.YT.PlayerState.PLAYING) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
      } catch (err) {
        console.error('Error toggling YouTube:', err);
        setPlayerError('Error playing YouTube video');
      }
    } else if (videoRef.current) {
      try {
        console.log('Toggling HTML5 video, isPlaying:', isPlaying);
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      } catch (err) {
        console.error('Error toggling HTML5:', err);
        setPlayerError('Error playing video');
      }
    } else {
      console.error('No player available');
      setPlayerError('No video player');
    }
  };

  const contentOuterClasses = 'w-full max-lg:pr-0 h-full pr-60 flex flex-col';
  const contentHeaderClasses = 'w-full max-lg:px-4 max-lg:py-0 max-lg:pb-10 px-20 border-b border-gray-300 py-20';
  const contentButtonContainerClasses = 'flex items-center justify-center p-4';

  return (
    <div className={contentOuterClasses}>
      <div className={contentHeaderClasses}>
        <div className='flex justify-between mb-6 items-center'>
          <div>
            <h1 className='font-bold'>{title}</h1>
            <p className='text-xs text-gray-700 mt-2'>{description}</p>
          </div>
          <div className='flex items-center gap-2'>
            <div onClick={onPreviousLesson} className='items-center p-2 cursor-pointer bg-gray-200 rounded-full rotate-180 flex w-7 h-7 justify-center'>
              <ForwardArrowSVG size={13} />
            </div>
            <div onClick={onNextLesson} className='items-center p-2 cursor-pointer bg-gray-200 rounded-full flex w-7 h-7 justify-center'>
              <ForwardArrowSVG size={13} />
            </div>
          </div>
        </div>
        <div className='w-full h-80 max-lg:h-60 relative'>
          {isYouTube ? (
            <>
              <div ref={youtubePlayerDivRef} id="youtube-player" className='w-full h-full' />
              {isYouTubeLoading && (
                <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white bg-opacity-75'>
                  <div className="loader"></div>
                </div>
              )}
              {playerError && (
                <div className='absolute top-0 left-0 w-full h-full bg-gray-800 bg-opacity-50 flex items-center justify-center'>
                  <p className='text-white text-xs'>{playerError}</p>
                </div>
              )}
            </>
          ) : (
            <video
              ref={videoRef}
              src={videoUrl}
              className='w-full h-full object-cover'
              controls
              onEnded={() => setIsPlaying(false)}
            />
          )}
          {!isYouTube && (
            <button
              onClick={togglePlayPause}
              className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#68049B] rounded-full p-2 opacity-10 hover:opacity-100 transition-opacity duration-200'
              style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isPlaying ? <Pause size={18} color='white' /> : <Play size={18} color='white' />}
            </button>
          )}
        </div>
      </div>
      <div className={contentButtonContainerClasses}>
        <button onClick={onComplete} className='py-2 px-4 rounded-lg text-xs bg-[#FFD30F] font-bold'>
          Complete and Continue
        </button>
      </div>
    </div>
  );
});

export default CourseComponent;