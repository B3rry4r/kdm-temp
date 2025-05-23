import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { ForwardArrowSVG } from '../../../../assets/icons/icons'; // Ensure this path is correct

// Ensure window.YT type definition if you're using TypeScript
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
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
  videoUrl: string; // This prop will now come from StartedCoursePage
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

  const youtubeVideoId = getYouTubeVideoId(videoUrl); // Use the actual prop

  const currentYouTubeVideoIdRef = useRef<string | null>(null);

  // --- DEBUGGING: Initial render and prop changes ---
  console.log(`[RENDER] CourseComponent rendered. videoUrl: ${videoUrl}, youtubeVideoId: ${youtubeVideoId}`);
  console.log(`[RENDER] isYouTube: ${isYouTube}, isYouTubeLoading: ${isYouTubeLoading}, playerError: ${playerError}`);
  // This useEffect will show if props passed to CourseComponent are actually changing.
  useEffect(() => {
    console.log('[CourseComponent] Props changed detection:', { title, description, videoUrl });
  }, [title, description, videoUrl]);
  // --- END DEBUGGING ---


  // Use a ref to track if the component is mounted, to avoid state updates on unmounted component
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);


  // initializeOrUpdatePlayer is wrapped in useCallback to ensure stability
  const initializeOrUpdatePlayer = useCallback(() => {
    console.log('[DEBUG initializeOrUpdatePlayer] Function called.');
    const videoIdToLoad = currentYouTubeVideoIdRef.current; // Use the ref value

    if (!videoIdToLoad) {
      console.log('[DEBUG initializeOrUpdatePlayer] No YouTube video ID available. Exiting.');
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (isMounted.current) setIsYouTubeLoading(false);
      return;
    }

    if (!(window as any).YT || !(window as any).YT.Player) {
      console.warn('[WARN initializeOrUpdatePlayer] YouTube API not yet available. Retrying via onYouTubeIframeAPIReady.');
      return;
    }

    const playerDiv = youtubePlayerDivRef.current;
    if (!playerDiv) {
      console.error('[ERROR initializeOrUpdatePlayer] YouTube player div ref is null. Element not in DOM?');
      if (isMounted.current) setPlayerError('YouTube player container not found (DOM issue).');
      if (isMounted.current) setIsYouTubeLoading(false);
      return;
    }
    console.log(`[DEBUG initializeOrUpdatePlayer] Found player div ref:`, playerDiv);

    if (playerRef.current && playerRef.current.getVideoData()?.video_id === videoIdToLoad) {
      console.log(`[DEBUG initializeOrUpdatePlayer] Player already initialized for current video ${videoIdToLoad}.`);
      if (isMounted.current) setIsYouTubeLoading(false);
      return;
    }

    if (playerRef.current) {
      console.log('[DEBUG initializeOrUpdatePlayer] Destroying existing YouTube player instance.');
      playerRef.current.destroy();
      playerRef.current = null;
    }

    console.log(`[DEBUG initializeOrUpdatePlayer] Initializing new YouTube player for video ID: ${videoIdToLoad}`);
    if (isMounted.current) setIsYouTubeLoading(true);

    playerRef.current = new (window as any).YT.Player(playerDiv, {
      height: '100%',
      width: '100%',
      videoId: videoIdToLoad,
      playerVars: {
        controls: 1,
        modestbranding: 1,
        origin: window.location.origin,
        autoplay: 1,
      },
      events: {
        onReady: () => {
          console.log('[DEBUG initializeOrUpdatePlayer] YouTube player is ready!');
          if (isMounted.current) {
            setPlayerError(null);
            setIsYouTubeLoading(false);
            setIsPlaying(true); // Assuming autoplay
          }
        },
        onStateChange: (event: any) => {
          const state = event.data;
          console.log(`[DEBUG initializeOrUpdatePlayer] Player state changed: ${state}`);
          if (isMounted.current) {
            setIsPlaying(state === (window as any).YT.PlayerState.PLAYING);
          }
        },
        onError: (event: any) => {
          const errorCode = event.data;
          console.error(`[ERROR initializeOrUpdatePlayer] YouTube player error: Code ${errorCode}`);
          if (isMounted.current) {
            setPlayerError(`Youtubeer error: Code ${errorCode}`);
            setIsYouTubeLoading(false);
          }
        },
      },
    });
  }, []); // useCallback dependencies: empty if no external state/props are directly used in the function body


  // Effect to load YouTube IFrame Player API script
  useEffect(() => {
    console.log('[EFFECT 1] Script loading effect running. Current youtubeVideoId:', youtubeVideoId);

    if (youtubeVideoId && !((window as any).YT && (window as any).YT.Player)) {
      if (isMounted.current) setIsYouTubeLoading(true);
      console.log('[DEBUG EFFECT 1] Attempting to load YouTube IFrame API script...');
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api'; // Corrected YouTube API URL
      tag.onerror = () => {
        console.error('[ERROR EFFECT 1] Failed to load YouTube IFrame API script');
        if (isMounted.current) {
          setPlayerError('Failed to load YouTube API script');
          setIsYouTubeLoading(false);
        }
      };
      tag.onload = () => {
        console.log('[DEBUG EFFECT 1] YouTube IFrame API script loaded successfully');
        // Check if we have a video ID AND the div AND the API is ready *immediately* after script load
        if (youtubeVideoId && youtubePlayerDivRef.current && (window as any).YT && (window as any).YT.Player) {
          console.log('[DEBUG EFFECT 1] API loaded, immediately calling initializeOrUpdatePlayer for current video.');
          initializeOrUpdatePlayer(); // Initialize *immediately* after script load
        }
      };
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        console.error('[ERROR EFFECT 1] No script tags found to insert YouTube API');
        if (isMounted.current) {
          setPlayerError('Cannot load YouTube API: No script tags found');
          setIsYouTubeLoading(false);
        }
      }
    } else if (!youtubeVideoId) {
      if (isMounted.current) setIsYouTubeLoading(false);
      console.log('[DEBUG EFFECT 1] Not a YouTube video, skipping API script load.');
    } else {
      console.log('[DEBUG EFFECT 1] YouTube API already loaded, skipping script insertion.');
      // If API is already loaded and it's a YouTube video, attempt to init player.
      if (youtubeVideoId && youtubePlayerDivRef.current) {
        initializeOrUpdatePlayer();
      }
    }
  }, [youtubeVideoId, initializeOrUpdatePlayer]); // youtubeVideoId added as dependency


  // This effect handles the YouTube player lifecycle based on videoUrl changes
  useEffect(() => {
    console.log('[EFFECT 2] Player lifecycle effect running. Current videoUrl:', videoUrl);
    
    // Set isYouTube based on the current prop
    if (isMounted.current) setIsYouTube(!!youtubeVideoId);
    if (isMounted.current) setPlayerError(null); // Clear errors on video URL change
    currentYouTubeVideoIdRef.current = youtubeVideoId; // Keep ref updated with current ID

    // *Crucially*, check if the API is loaded AND the div ref exists *before* trying to initialize
    if (youtubeVideoId) { // Only if we have a valid video ID
      console.log('[DEBUG EFFECT 2] It is a YouTube video. Checking API and div ref.');
      if ((window as any).YT && (window as any).YT.Player && youtubePlayerDivRef.current) {
        // *IMPORTANT*: Check ALL conditions: API loaded, div ref exists
        console.log('[DEBUG EFFECT 2] API loaded and div ref exists. Calling initializeOrUpdatePlayer directly from EFFECT 2.');
        initializeOrUpdatePlayer(); // Initialize *immediately*
      } else {
        // If API not loaded or div not ready, set global callback
        console.log('[DEBUG EFFECT 2] API not loaded or div ref not ready. Setting global onYouTubeIframeAPIReady.');
        (window as any).onYouTubeIframeAPIReady = initializeOrUpdatePlayer;
      }
    } else {
      console.log('[DEBUG EFFECT 2] Not a YouTube video. Cleaning up YouTube player if exists.');
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (isMounted.current) {
        setIsYouTubeLoading(false);
        setIsPlaying(false);
      }
    }

    return () => {
      console.log('[DEBUG EFFECT 2] Cleanup function running for videoUrl:', videoUrl);
      if (playerRef.current) {
        try {
          // Check if player is not already destroyed
          if (typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
            console.log('[DEBUG EFFECT 2] YouTube player destroyed during cleanup.');
          }
        } catch (err: any) {
          console.error('[ERROR EFFECT 2] Error destroying YouTube player in cleanup:', err.message);
        } finally {
          playerRef.current = null;
        }
      }
      // Reset global callback if it's currently ours
      // Only remove if it's *our* function to avoid clashing with other potential players
      if ((window as any).onYouTubeIframeAPIReady === initializeOrUpdatePlayer) {
        console.log('[DEBUG EFFECT 2] Removing global onYouTubeIframeAPIReady callback.');
        delete (window as any).onYouTubeIframeAPIReady;
      }
      // Also ensure isMounted is false if unmounting completely
      isMounted.current = false;
    };
  }, [youtubeVideoId, initializeOrUpdatePlayer, videoUrl]); // Dependencies: youtubeVideoId, initializeOrUpdatePlayer

  const togglePlayPause = () => {
    if (isYouTube && playerRef.current) {
      try {
        if (typeof playerRef.current.getPlayerState !== 'function') {
          console.error('[ERROR] YouTube player methods not available. Player might not be fully initialized.');
          setPlayerError('YouTube player not ready.');
          return;
        }
        const currentState = playerRef.current.getPlayerState();
        console.log(`[DEBUG] Toggling play/pause. Current state: ${currentState}`);
        if (currentState === (window as any).YT.PlayerState.PLAYING) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
      } catch (err: any) {
        console.error('[ERROR] Error toggling YouTube video playback:', err.message);
        setPlayerError('Error playing YouTube video');
      }
    } else if (videoRef.current) {
      try {
        console.log('[DEBUG] Toggling native video player');
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      } catch (err: any) {
        console.error('[ERROR] Error toggling native video playback:', err.message);
        setPlayerError('Error playing video');
      }
    } else {
      console.error('[ERROR] No video player available');
      setPlayerError('No video player available');
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
            <div onClick={onPreviousLesson} className='items-center p-2 cursor-pointer bg-gray-200 rounded-full rotate-180 overflow-hidden flex w-7 h-7 justify-center'>
              <ForwardArrowSVG size={13} />
            </div>
            <div onClick={onNextLesson} className='items-center p-2 cursor-pointer bg-gray-200 rounded-full overflow-hidden flex w-7 h-7 justify-center'>
              <ForwardArrowSVG size={13} />
            </div>
          </div>
        </div>
        <div className='w w-full h-80 max-lg:h-60 relative'>
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
              onEnded={() => {
                console.log('[DEBUG] Native video ended');
                setIsPlaying(false);
              }}
            />
          )}
          {!isYouTube && (
            <button
              onClick={togglePlayPause}
              className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#68049B] rounded-full p-2 opacity-10 hover:opacity-100 transition-opacity duration-200'
              style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isPlaying ? (
                <Pause size={18} color='white' />
              ) : (
                <Play size={18} color='white' />
              )}
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