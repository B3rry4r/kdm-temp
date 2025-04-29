import React from 'react';
import { LucideLinkedin, YoutubeIcon } from 'lucide-react';

interface SpeakerProps {
  fullname: string;
  profession: string;
  image_url: string;
  linkedin_url: string;
  youtube_url: string;
}

const Speakers: React.FC<SpeakerProps> = ({
  fullname,
  profession,
  image_url,
  linkedin_url,
  youtube_url,
}) => {
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="w-40 h-40 max-sm:w-25 max-sm:h-25 rounded-full bg-gray-300">
        <img
          src={image_url}
          alt={fullname}
          className="w-full h-full rounded-full object-cover"
        />
      </div>
      <p className="font-bold text-md mt-3">{fullname}</p>
      <p className="text-sm">{profession}</p>
      <div className="flex items-center gap-4">
        <a
          href={linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-6 h-6 cursor-pointer bg-[#0077B5] rounded-sm flex items-center justify-center"
        >
          <LucideLinkedin size={16} color="white" />
        </a>
        <a
          href={youtube_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-6 h-6 cursor-pointer bg-[#FF0000] rounded-sm flex items-center justify-center"
        >
          <YoutubeIcon size={16} color="white" />
        </a>
      </div>
    </div>
  );
};

export default Speakers;