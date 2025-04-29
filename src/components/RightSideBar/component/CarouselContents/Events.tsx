import React from 'react';
import { useNavigate } from 'react-router-dom';

// Define types for props
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

interface Props {
  event: Event;
  height?: string;
}

const Events: React.FC<Props> = ({ event, height }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/events/event/${event.id}`); // Include event ID in the URL
  };

  return (
    <div className={`w-full h-${height} flex flex-col rounded-lg bg-white gap-3 items-center justify-center p-4`}>
      {/* Event Image */}
      <div className="w-full h-[40%] rounded-sm overflow-hidden bg-gray-500">
        <img src={event.image_url} alt="events image" className="w-full h-full object-cover" />
      </div>

      {/* Event Details */}
      <div className="w-full h-[60%] flex flex-col justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-md font-bold text-gray-800">{event.title}</h1>
          <div className="h-20 w-full p-1 overflow-hidden">
            <p className="text-xs text-gray-500 overflow-hidden">{event.about}</p>
          </div>
          <div className="dtl flex mt-6 items-center justify-between">
            <div className="date">
              <p className="text-[10px] text-gray-500">{event.date}</p>
            </div>
            <div className="time">
              <p className="text-[10px] text-gray-500">{event.time}</p>
            </div>
            <div className="location">
              <p className="text-[10px] text-gray-500">{event.location}</p>
            </div>
          </div>
        </div>

        {/* Price and Learn More */}
        <div className="bottom item-end flex items-center justify-between">
          <p className="text-sm font-bold text-gray-800">
            {event.price ? `N${event.price}` : 'Free'}
          </p>
          <p
            onClick={handleClick}
            className="cursor-pointer text-sm font-bold text-gray-800"
          >
            Learn More
          </p>
        </div>
      </div>
    </div>
  );
};

export default Events;