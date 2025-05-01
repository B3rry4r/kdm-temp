import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import Events from '../../components/RightSideBar/component/CarouselContents/Events';
import { useSearch } from '../../components/header/Header';
import AlertMessage from '../../components/AlertMessage';

// Define types for categories and events
interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
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

const EventsPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All Events');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const { apiClient2, apiClient3 } = useAuth();
  const { searchQuery } = useSearch();

  // Fetch categories and events
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories
        const categoriesResponse = await apiClient3.get<Category[]>('/consultant/event/categories');
        const categoriesData = categoriesResponse.data;

        // Fetch events
        const eventsResponse = await apiClient2.get<Event[]>('/events');
        const eventsData = eventsResponse.data;

        setCategories(categoriesData);
        setEvents(eventsData);
      } catch (err: any) {
        setError('Failed to load events data');
        setAlertMsg('Failed to load events data');
        setAlertOpen(true);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiClient2, apiClient3]);

  // Filter events based on active category and search query
  const filteredEvents = useMemo(() => {
    // First filter by category
    const categoryFiltered = activeFilter === 'All Events'
      ? events
      : events.filter(event => event.event_category === activeFilter);
    
    // Then filter by search query
    if (!searchQuery.trim()) {
      return categoryFiltered;
    }
    
    const query = searchQuery.toLowerCase();
    return categoryFiltered.filter(event => 
      event.title.toLowerCase().includes(query) ||
      event.about.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query) ||
      event.organiser?.toLowerCase().includes(query) ||
      event.event_category.toLowerCase().includes(query)
    );
  }, [events, activeFilter, searchQuery]);

  if (loading) {
    return (
      <div className="w-full max-sm:w-full h-full flex items-center justify-center">
        <div className='loader'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-sm:w-full h-full flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-[80%] max-lg:w-full max-sm:w-full relative p-10 max-sm:p-0 border-r border-gray-200 overflow-y-auto h-full">
      <div className="flex flex-col gap-3">
        {/* Header Banner */}
        <div className="flex flex-col items-center justify-center w-full h-40 max-sm:h-40 bg-gradient-to-r from-[#68049B] to-[#FFD30F] gap-2">
          <p className="text-xl font-bold text-white">Events</p>
        </div>

        {/* Filters */}
        <div className="filters max-sm:p-6 sticky top-[69px] mt-5 w-full flex items-center justify-between border-b border-gray-200 pb-2 gap-2">
          <div className="left flex items-center gap-3">
            <p
              onClick={() => setActiveFilter('All Events')}
              className={`text-xs font-bold cursor-pointer ${activeFilter === 'All Events' ? 'text-[#68049B]' : ''}`}
            >
              All Events
            </p>
            {categories.map(category => (
              <p
                key={category.id}
                onClick={() => setActiveFilter(category.name)}
                className={`text-xs font-bold cursor-pointer ${activeFilter === category.name ? 'text-[#68049B]' : ''}`}
              >
                {category.name}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="max-sm:px-6 my-4">
          <p className="text-sm">
            Showing results for: <span className="font-semibold">{searchQuery}</span>
            {activeFilter !== 'All Events' && <span> in <span className="font-semibold">{activeFilter}</span></span>}
          </p>
        </div>
      )}

      {/* Events Grid */}
      <div className="max-sm:p-6">
        <h1 className="font-bold my-4">
          {searchQuery ? 'Search Results' : activeFilter === 'All Events' ? 'All Events' : activeFilter}
        </h1>
        <div className="grid grid-cols-3 max-sm:grid-cols-1 max-md:grid-cols-1 max-lg:grid-cols-2 gap-3">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <Events key={event.id} event={event} height="90" />
            ))
          ) : (
            <p className="text-gray-500 col-span-3">
              {searchQuery 
                ? `No events found matching "${searchQuery}"${activeFilter !== 'All Events' ? ` in ${activeFilter}` : ''}.` 
                : `No events found for ${activeFilter}.`}
            </p>
          )}
        </div>
      </div>
      
      <AlertMessage 
        open={alertOpen} 
        message={alertMsg} 
        severity="purple" 
        onClose={() => setAlertOpen(false)} 
      />
    </div>
  );
};

export default EventsPage;