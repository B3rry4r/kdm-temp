import React, { useState, useEffect } from 'react';
import CarouselComponent from './component/CarouselComponent';
import Events from './component/CarouselContents/Events';
import { useAuth } from '../../context/AuthContext/AuthContext';

// Define types for ads and events
interface Ad {
  id: number;
  image: string;
  created_at: string;
  type: number;
  link: string;
}

interface Event {
  id: number;
  category_id: number;
  title: string;
  date: string;
  time: string;
  about: string;
  location: string;
  type: string;
  address: string;
  catchup_url: string;
  price: string;
  org_id: number | null;
  status: boolean;
  training_type: string;
  created_at: string;
  organiser: string | null;
  image_url: string;
  event_category: string;
}

const RightSideBar: React.FC = () => {
  const { apiClient, apiClient2 } = useAuth();
  const [selectedAds, setSelectedAds] = useState<Ad[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch and randomize ads
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await apiClient.get<Ad[]>('/ad/home/one/get');
        const ads: Ad[] = response.data;
        // Shuffle and select up to 2 ads
        const shuffled = [...ads].sort(() => Math.random() - 0.5);
        setSelectedAds(shuffled.slice(0, 2));
      } catch (err: any) {
        console.error('Failed to load ads:', err);
      }
    };
    fetchAds();
  }, [apiClient]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const response = await apiClient2.get<Event[]>('/events');
        setEvents(response.data);
      } catch (err: any) {
        setError('Failed to load events');
        console.error(err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  // Render ad slide
  const renderAdSlide = (ad: Ad | null, index: number) => {
    if (!ad) {
      return (
        <div
          key={`placeholder-ad-${index}`}
          className="w-full h-full flex items-center justify-center relative bg-gray-200"
        >
          <p className="text-lg font-bold">No ad available</p>
        </div>
      );
    }
    const url = ad.link.startsWith('http://') || ad.link.startsWith('https://') ? ad.link : `https://${ad.link}`;
    return (
      <div
        key={`ad-${ad.id}`}
        className="w-full h-full flex items-center justify-center relative cursor-pointer"
        onClick={() => (window.location.href = url)}
      >
        <img
          src={ad.image}
          alt={`Ad ${ad.id}`}
          className="w-full h-full object-cover absolute top-0 left-0"
        />
      </div>
    );
  };

  // Render event slide
  const renderEventSlide = (event: Event | null, index: number) => {
    if (!event) {
      return (
        <div
          key={`placeholder-event-${index}`}
          className="w-full h-full flex items-center justify-center relative bg-gray-200"
        >
          <p className="text-lg font-bold">No event available</p>
        </div>
      );
    }
    return <Events key={`event-${event.id}`} event={event} height="90" />;
  };

  // Generate 2 ad slides
  const adSlides = () => {
    if (selectedAds.length === 0) {
      return [renderAdSlide(null, 0), renderAdSlide(null, 1)];
    }
    if (selectedAds.length === 1) {
      return [renderAdSlide(selectedAds[0], 0), renderAdSlide(selectedAds[0], 1)]; // Duplicate single ad
    }
    return selectedAds.map((ad, index) => renderAdSlide(ad, index)); // 2 ads
  };

  // Generate 2 event slides for a carousel
  const eventSlides = () => {
    if (events.length === 0) {
      return [renderEventSlide(null, 0), renderEventSlide(null, 1)];
    }
    // Shuffle and select up to 2 events
    const shuffled = [...events].sort(() => Math.random() - 0.5);
    const selectedEvents = shuffled.slice(0, 2);
    if (selectedEvents.length === 1) {
      return [renderEventSlide(selectedEvents[0], 0), renderEventSlide(selectedEvents[0], 1)]; // Duplicate single event
    }
    return selectedEvents.map((event, index) => renderEventSlide(event, index)); // 2 events
  };

  return (
    <div className="w-full h-full py-10 pr-20 max-lg:pr-0 max-xl:py-6 pl-6 max-xl:pl-4 pr-6 max-xl:pr-4 flex flex-col gap-10 max-xl:gap-6 border-l border-gray-200 max-lg:hidden">
      {/* Ads Carousel */}
      <div className="w-full min-h-[150px] max-lg:min-h-[120px]">
        <CarouselComponent>{adSlides()}</CarouselComponent>
      </div>

      {/* First Events Carousel */}
      <div className="w-full min-h-[350px] max-lg:min-h-[300px] max-xl:min-h-[320px] flex flex-col items-center justify-center">
        {error && <p className="text-red-500">{error}</p>}
        {loadingEvents ? (
          <p className="text-gray-500">Loading events...</p>
        ) : (
          <CarouselComponent>{eventSlides()}</CarouselComponent>
        )}
      </div>

      {/* Second Events Carousel */}
      <div className="w-full min-h-[350px] max-lg:min-h-[300px] max-xl:min-h-[320px] flex flex-col items-center justify-center">
        {error && <p className="text-red-500">{error}</p>}
        {loadingEvents ? (
          <p className="text-gray-500">Loading events...</p>
        ) : (
          <CarouselComponent>{eventSlides()}</CarouselComponent>
        )}
      </div>

      {/* Spacer */}
      <div className="w-full min-h-10"></div>
    </div>
  );
};

export default RightSideBar;