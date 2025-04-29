import React from 'react';

interface Ad {
  id: number;
  image: string;
  created_at: string;
  type: number;
  link: string;
}

type BannerProps = {
  ad: Ad;
};

const Banner: React.FC<BannerProps> = ({ ad }) => {
  if (!ad || !ad.link) {
    console.warn('Banner: Invalid ad provided:', JSON.stringify(ad, null, 2));
    return null;
  }

  const url = ad.link.startsWith('http://') || ad.link.startsWith('https://') ? ad.link : `https://${ad.link}`;

  return (
    <div
      className="w-full banner min-h-[200px] bg-gray-200 relative rounded-md overflow-hidden flex items-center justify-center cursor-pointer"
      onClick={() => (window.location.href = url)}
    >
      <img src={ad.image} alt={`Ad ${ad.id}`} className="w-full absolute top-0 left-0 h-full object-cover" />
      {/* <p className="text-lg font-bold relative z-10">{`Ad ${ad.id}`}</p> */}
    </div>
  );
};

export default Banner;