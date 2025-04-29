import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import {
  CertificateSVG,
  ForwardArrowSVG,
  ListSVG,
  TimerSVG,
} from '../../../assets/icons/icons';
import { DynamicRow } from '../../MyCoursesPage/SingleCousre/MySingleCourse';
import Speakers from './components/Speakers';
import Events from '../../../components/RightSideBar/component/CarouselContents/Events';
import Modal from '../../Registration/Modal';

// Define types for event, related events, and speakers
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
  registered: boolean; // Added to track registration status
}

interface Speaker {
  id: number;
  training_id: number;
  fullname: string;
  profession: string;
  linkedin_url: string;
  youtube_url: string;
  image_url: string;
}

const SingleEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { apiClient2, apiClient, user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'payment' | 'auth'>('payment');
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Extract tx_ref from URL query params (for paid events after redirect)
  const queryParams = new URLSearchParams(location.search);
  const txRef = queryParams.get('tx_ref');

  // Fetch event details, related events, speakers, and handle tx_ref
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Event ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch event details
        const eventResponse = await apiClient2.get<Event>(`/event/${id}`);
        console.log('GET /event/${id} response:', JSON.stringify(eventResponse.data, null, 2));
        const eventData = eventResponse.data;
        setEvent(eventData);
        setHasRegistered(eventData.registered);

        // Fetch related events
        const eventsResponse = await apiClient2.get<Event[]>('/events');
        console.log('GET /events response:', JSON.stringify(eventsResponse.data, null, 2));
        setRelatedEvents(eventsResponse.data.slice(0, 5));

        // Fetch speakers
        const speakersResponse = await apiClient2.get<Speaker[]>(`/event/speakers/${id}`);
        console.log('GET /event/speakers/${id} response:', JSON.stringify(speakersResponse.data, null, 2));
        setSpeakers(speakersResponse.data);

        // If tx_ref exists, verify the payment
        if (txRef && user && !eventData.registered) {
          await verifyPayment(parseInt(id), txRef);
        }
      } catch (err: any) {
        console.error('Error fetching event data:', err.response?.data || err.message);
        setError('Failed to load event data');
        if (err.response?.status === 401) {
          setModalType('auth');
          setIsModalOpen(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiClient2, id, txRef, user]);

  // Verify payment for paid events
  const verifyPayment = async (eventId: number, txRef: string) => {
    if (!user || !user.id) {
      setError('User not authenticated');
      return;
    }

    try {
      setIsRegistering(true);
      setModalType('payment');
      setPaymentError(null);

      const payload = {
        user_id: user.id,
        event_id: eventId,
        tx_ref: txRef,
      };
      const response = await apiClient.post('/event/register/complete', payload);
      console.log('POST /event/register/complete response:', JSON.stringify(response.data, null, 2));

      if (response.data.message === 'Payment successful') {
        setPaymentStatus('success');
        setHasRegistered(true);
        setEvent((prev) => (prev ? { ...prev, registered: true } : null));
        setIsModalOpen(true);
      } else {
        setPaymentStatus('failed');
        setPaymentError(response.data.message || 'Payment verification failed');
        setIsModalOpen(true);
      }
    } catch (err: any) {
      console.error('Error verifying payment:', err.response?.data || err.message);
      setPaymentStatus('failed');
      setPaymentError(err.response?.data?.message || 'Failed to verify payment');
      setIsModalOpen(true);
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle event registration
  const handleRegister = async () => {
    if (!id || !user || !user.id) {
      setError('User not authenticated or event ID missing');
      if (!user || !user.id) {
        setModalType('auth');
        setIsModalOpen(true);
      }
      return;
    }

    try {
      setIsRegistering(true);
      setError(null);
      setPaymentError(null);

      const eventId = parseInt(id);
      const redirectUrl = window.location.href; // Redirect back to this page
      const payload = {
        user_id: user.id,
        event_id: eventId,
        redirect_url: redirectUrl,
      };

      console.log('Event registration payload:', JSON.stringify(payload, null, 2));
      const response = await apiClient.post('/event/register', payload);
      console.log('POST /event/register response:', JSON.stringify(response.data, null, 2));

      // For free events, mark as registered immediately
      if (!event?.price || event.price === '0' || event.price.toLowerCase() === 'free') {
        setHasRegistered(true);
        setEvent((prev) => (prev ? { ...prev, registered: true } : null));
        setPaymentStatus('success');
        setModalType('payment');
        setIsModalOpen(true);
      } else {
        // For paid events, redirect to payment gateway
        if (response.data.data?.link) {
          window.location.href = response.data.data.link;
        } else {
          throw new Error('Payment link not provided');
        }
      }
    } catch (err: any) {
      console.error('Error registering for event:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to register for event');
      if (err.response?.status === 401) {
        setModalType('auth');
        setIsModalOpen(true);
      } else {
        setPaymentStatus('failed');
        setPaymentError(err.response?.data?.message || 'Failed to initiate registration');
        setModalType('payment');
        setIsModalOpen(true);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleEnrollClick = () => {
    navigate('/events');
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setPaymentError(null);
    setPaymentStatus(null);
    // Remove tx_ref from URL
    if (txRef) {
      navigate(`/event/${id}`, { replace: true });
    }
  };

  const renderModalContent = () => {
    if (modalType === 'payment') {
      return (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-[#68049B]">
            {paymentStatus === 'success' ? 'Registration Successful' : 'Registration Failed'}
          </h2>
          <p className="text-sm text-gray-600">
            {paymentStatus === 'success'
              ? 'You have successfully registered for the event!'
              : paymentError || 'Registration failed. Please try again.'}
          </p>
          <button
            onClick={paymentStatus === 'success' ? () => navigate('/events') : handleRegister}
            className="w-full p-3 font-bold bg-[#ffd30f] rounded-lg"
          >
            {paymentStatus === 'success' ? 'Go to Events' : 'Try Again'}
          </button>
        </div>
      );
    }
    if (modalType === 'auth') {
      return (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-[#68049B]">Authentication Required</h2>
          <p className="text-sm text-gray-600">Please log in to continue.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full p-3 font-bold bg-[#ffd30f] rounded-lg"
          >
            Log In
          </button>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full max-sm:w-full h-full flex items-center justify-center">
        <div className="loader"></div>
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

  if (!event) {
    return (
      <div className="w-full max-sm:w-full h-full flex items-center justify-center">
        <p className="text-red-500">Event not found</p>
      </div>
    );
  }

  return (
    <div className="w-[80%] max-sm:w-full overflow-y-scroll h-full flex flex-col gap-3 max-sm:p-4 p-10 border-r border-gray-200">
      <Modal isOpen={isModalOpen} onClose={handleModalClose} width="w-90">
        {renderModalContent()}
      </Modal>
      {/* Back Button */}
      <div
        onClick={handleEnrollClick}
        className="cursor-pointer w-10 min-h-10 rotate-180 bg-gray-300 rounded-full flex items-center justify-center"
      >
        <ForwardArrowSVG size={13} />
      </div>

      {/* Event Banner */}
      <div
        className="flex items-center justify-end p-10 relative max-sm:p-2 w-full max-sm:min-h-[500px] max-sm:items-end h-100 bg-gray-400"
      >
        <img src={event.image_url} alt="event image" className='w-full h-full object-cover absolute top-0 left-0'/>
        <div className="w-[50%] z-1 max-sm:w-full max-sm:h-[65%] bg-white p-5 justify-between flex flex-col rounded-lg">
          <div className="flex flex-col w-full gap-4">
            <h1 className="font-bold text-2xl">{event.title}</h1>
            <div className="flex gap-1 items-center">
              <DynamicRow icon={<TimerSVG size={15} />} text={event.date} />
              <DynamicRow icon={<ListSVG size={15} />} text={event.time} />
              <DynamicRow icon={<CertificateSVG size={15} />} text={event.location} />
            </div>
            <div className="flex items-center gap-1">
              <p className="text-sm">Organized by</p>
              <p className="text-sm font-bold">{event.organiser || 'Kudimata'}</p>
            </div>
          </div>
          <div className="w-full flex items-center justify-between">
            <p className="text-md font-bold">
              {event.price && event.price !== '0' ? `N${event.price}` : 'Free'}
            </p>
            <button
              onClick={handleRegister}
              disabled={isRegistering || hasRegistered}
              className={`py-2 px-6 bg-[#FFD30F] rounded-lg font-bold text-md ${
                isRegistering || hasRegistered ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isRegistering ? <span className="loader w-full"></span> : hasRegistered ? 'Registered' : 'Attend'}
            </button>
          </div>
        </div>
      </div>

      {/* About Event */}
      <h1 className="font-bold text-2xl mt-5">About Event</h1>
      <p className="text-sm w-[50%] max-sm:w-full">{event.about}</p>

      {/* Speakers (only show if there are speakers) */}
      {speakers.length > 0 && (
        <>
          <h1 className="font-bold text-2xl mt-5">Meet Our Speakers</h1>
          <div className="grid mt-5 mb-3 w-full grid-cols-4 max-sm:grid-cols-2 gap-2">
            {speakers.map((speaker) => (
              <Speakers
                key={speaker.id}
                fullname={speaker.fullname}
                profession={speaker.profession}
                image_url={speaker.image_url}
                linkedin_url={speaker.linkedin_url}
                youtube_url={speaker.youtube_url}
              />
            ))}
          </div>
        </>
      )}

      {/* More Events Like This */}
      <h1 className="font-bold text-2xl mt-5">More Events Like This</h1>
      <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-3">
        {relatedEvents.length > 0 ? (
          relatedEvents.map((event) => (
            <Events key={event.id} event={event} height="90" />
          ))
        ) : (
          <p className="text-gray-500">No related events found.</p>
        )}
      </div>
    </div>
  );
};

export default SingleEventPage;