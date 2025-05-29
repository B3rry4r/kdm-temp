import React, { useState, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { Play, Pause } from 'lucide-react';
import { ForwardArrowSVG } from '../../../../assets/icons/icons';

interface CourseProps {
  title: string;
  description: string;
  videoUrl: string;
  onComplete: () => void;
  onPreviousLesson: () => void;
  onNextLesson: () => void;
}

const getYouTubeVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const CourseComponent: React.FC<CourseProps> = React.memo(({ title, description, videoUrl, onComplete, onPreviousLesson, onNextLesson }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isYouTubeLoading, setIsYouTubeLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const youtubeVideoId = getYouTubeVideoId(videoUrl);
  const isYouTube = !!youtubeVideoId;

  const onYouTubeReady: YouTubeProps['onReady'] = (event) => {
    setIsYouTubeLoading(false);
    youtubePlayerRef.current = event.target;
    console.log('YouTube player ready');
  };

  const onYouTubeStateChange: YouTubeProps['onStateChange'] = (event) => {
    const playing = event.data === window.YT?.PlayerState?.PLAYING;
    setIsPlaying(playing);
    console.log('YouTube player state:', event.data);
  };

  const onYouTubeError: YouTubeProps['onError'] = (event) => {
    setPlayerError(`YouTube error: Code ${event.data}`);
    setIsYouTubeLoading(false);
    console.error('YouTube player error:', event.data);
  };

  const togglePlayPause = () => {
    if (isYouTube && youtubePlayerRef.current) {
      try {
        const state = youtubePlayerRef.current.getPlayerState();
        console.log('Toggling YouTube player, state:', state);
        if (state === window.YT?.PlayerState?.PLAYING) {
          youtubePlayerRef.current.pauseVideo();
        } else {
          youtubePlayerRef.current.playVideo();
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
              <YouTube
                videoId={youtubeVideoId!}
                opts={{
                  height: '100%',
                  width: '100%',
                  playerVars: {
                    controls: 1,
                    modestbranding: 1,
                    origin: window.location.origin,
                  },
                }}
                onReady={onYouTubeReady}
                onStateChange={onYouTubeStateChange}
                onError={onYouTubeError}
                className='w-full h-full'
              />
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
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          )}
          {isYouTube && (
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

declare global {
  interface Window {
    YT?: any;
  }
}