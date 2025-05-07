import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CertificateSVG, ForwardArrowSVG, ListSVG, TimerSVG } from '../../../assets/icons/icons';
import { ReactNode } from 'react';
import DropDownComponents from './DropDownComponents/DropDownComponents';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import Modal from '../../Registration/Modal';
import AlertMessage from '../../../components/AlertMessage';

interface Course {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  type: string;
  price: string | number | null;
  org_id: number | null;
  section_count: number;
  lesson_count: number;
  enrolled: boolean;
  sections: {
    id: number;
    title: string;
    lessons: {
      id: number;
      title: string;
      body: string;
    }[];
  }[];
}

const SingleCourse = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { apiClient } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'org' | 'payment' | 'auth'>('org');
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrollButtonLoading, setIsEnrollButtonLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | null>(null);
  const [code, setCode] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setError('Invalid course ID');
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get<Course>(`/course/${courseId}`);
        console.log('Single course API response:', JSON.stringify(response.data, null, 2));
        const courseData = response.data;
        
        // Ensure enrolled status is properly set
        if (typeof courseData.enrolled === 'undefined') {
          console.warn('Enrolled status missing in API response, defaulting to false');
          courseData.enrolled = false;
        }
        
        // Log enrollment status for debugging
        console.log(`Course enrollment status: ${courseData.enrolled ? 'Enrolled' : 'Not enrolled'}`);
        
        setCourse(courseData);
      } catch (err: any) {
        console.error('Error fetching course:', err.response?.data || err.message);
        setError(err.response?.status === 401 ? 'Please log in' : 'Failed to load course');
        if (err.response?.status === 401) {
          setModalType('auth');
          setIsModalOpen(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, apiClient]);

  // Check for tx_ref on redirect from Flutterwave
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const txRef = params.get('tx_ref');
    if (txRef && courseId) {
      verifyPayment(txRef);
    }
  }, [location, courseId]);

  const verifyPayment = async (txRef: string) => {
    setIsEnrolling(true);
    setModalType('payment');

    try {
      const response = await apiClient.post('/course/enroll/paid', { tx_ref: txRef });
      console.log('Paid enrollment response:', JSON.stringify(response.data, null, 2));
      if (response.data.message === 'Payment successful') {
        setPaymentStatus('success');
        setCourse((prev) => (prev ? { ...prev, enrolled: true } : null));
        setIsModalOpen(true);
      } else {
        setPaymentStatus('failed');
        setEnrollError(response.data.message || 'Payment verification failed');
        setIsModalOpen(true);
      }
    } catch (err: any) {
      console.error('Error verifying payment:', err.response?.data || err.message);
      setPaymentStatus('failed');
      setEnrollError(err.response?.data?.message || 'Failed to verify payment');
      setIsModalOpen(true);
    } finally {
      setIsEnrolling(false);
    }
  };

  const enrollCourse = async () => {
    if (!course || !courseId) return;

    setIsEnrolling(true);
    setIsEnrollButtonLoading(true);
    setEnrollError(null);

    const typeMap: { [key: string]: number } = { Free: 1, Paid: 2, Org: 3 };
    const payload: any = {
      type: typeMap[course.type] || 2,
      course_id: parseInt(courseId),
    };

    if (course.type === 'Org') {
      if (!code.trim()) {
        setEnrollError('Please enter a valid code');
        setIsEnrolling(false);
        setIsEnrollButtonLoading(false);
        return;
      }
      if (course.org_id) {
        payload.org_id = course.org_id;
      }
      payload.code = code;
    } else if (course.type === 'Paid') {
      const redirectUrl = window.location.href;
      payload.redirect_url = redirectUrl;
    }

    try {
      console.log('Enrollment payload:', JSON.stringify(payload, null, 2));
      const response = await apiClient.post('/course/enroll', payload);
      console.log('Enrollment response:', JSON.stringify(response.data, null, 2));
      if (course.type === 'Paid' && response.data.data?.link) {
        window.location.href = response.data.data.link; // Redirect to Flutterwave
      } else {
        setCourse({ ...course, enrolled: true });
        setIsModalOpen(false);
        setPaymentStatus('success');
        setModalType('payment');
        setIsModalOpen(true);
        setAlertMsg('Successfully enrolled in the course!');
        setAlertOpen(true);
      }
    } catch (err: any) {
      console.error('Error enrolling:', err.response?.data || err.message);
      setEnrollError(err.response?.data?.message || 'Failed to enroll');
      setModalType(err.response?.status === 401 ? 'auth' : 'payment');
      setPaymentStatus('failed');
      setIsModalOpen(true);
    } finally {
      setIsEnrolling(false);
      setIsEnrollButtonLoading(false);
    }
  };

  const handleEnrollClick = () => {
    // Double check course exists
    if (!course) {
      setAlertMsg('Course information not available');
      setAlertOpen(true);
      return;
    }
    
    // Check if already enrolled
    if (course.enrolled) {
      console.log('User is already enrolled, navigating to My Courses');
      navigate('/my-courses');
      return;
    }
    
    // Check if enrollment is in progress
    if (isEnrollButtonLoading) {
      console.log('Enrollment in progress, please wait');
      return;
    }
    
    // Handle free courses
    if (course.type === 'Free') {
      enrollCourse();
      return;
    }
    
    // Handle organization courses
    if (course.type === 'Org') {
      setModalType('org');
      setIsModalOpen(true);
      setEnrollError(null);
      setCode('');
      return;
    }
    
    // Handle paid courses
    enrollCourse();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEnrollError(null);
    setCode('');
    setPaymentStatus(null);
  };

  // Render modal content as children
  const renderModalContent = () => {
    if (modalType === 'org') {
      return (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-[#68049B]">{course?.title || 'Enroll in Course'}</h2>
          <p className="text-sm text-gray-600">Enter the institution code to enroll in this course.</p>
          <input
            type="text"
            placeholder="Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            disabled={isEnrolling}
          />
          {enrollError && <p className="text-[#68049B] text-xs">{enrollError}</p>}
          <button
            onClick={enrollCourse}
            disabled={isEnrolling}
            className={`w-full p-3 font-bold bg-[#ffd30f] rounded-lg ${isEnrolling ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isEnrolling ? <span className="loader w-full"></span> : 'Enroll'}
          </button>
        </div>
      );
    }
    if (modalType === 'payment') {
      return (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-[#68049B]">{paymentStatus === 'success'
              ? 'Enrollment successful'
              : 'Enrollment Failed'}
              </h2>
          <p className="text-sm text-gray-600">
            {paymentStatus === 'success'
              ? 'You have successfully enrolled in the course!'
              : enrollError || 'Enrollment failed. Please try again.'}
          </p>
          <button
            onClick={paymentStatus === 'success' ? () => navigate('/my-courses') : handleEnrollClick}
            className="w-full p-3 font-bold bg-[#ffd30f] rounded-lg"
          >
            {paymentStatus === 'success' ? 'Go to My Courses' : 'Try Again'}
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

  // Format price (e.g., 4500 -> "$4,500")
  const formatPrice = (price: string | number | null): string => {
    if (price == null) return '';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '';
    return `$${numPrice.toLocaleString()}`;
  };

  // Render tag and price per CourseCard logic
  const renderTagAndPrice = () => {
    if (!course) return <p className="text-[#68049B] font-bold">Loading...</p>;
    const formattedPrice = formatPrice(course.price);
    if (course.type === 'Free') {
      return <p className="text-[#68049B] font-bold">Free</p>;
    }
    if (course.type === 'Paid') {
      return (
        <p className="text-[#68049B] font-bold">{formattedPrice || 'Paid'}</p>
      );
    }
    if (course.type === 'Org' || course.org_id) {
      return (
        <div className="flex flex-col">
          <p className="text-[#68049B] font-bold">Org</p>
          {formattedPrice && <p className="text-[#68049B] text-xs">{formattedPrice}</p>}
        </div>
      );
    }
    return <p className="text-[#68049B] font-bold">{course.type}</p>;
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center h-full">
        <div className="loader"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="w-full flex items-center justify-center h-full">
        <p className="text-[#68049B] text-xs">{error || 'Course not found'}</p>
      </div>
    );
  }

  return (
    <div className="flex overflow-y-auto h-full w-full">
      <Modal isOpen={isModalOpen} onClose={handleModalClose} width="w-90">
        {renderModalContent()}
      </Modal>
      <div className="w-full flex-[4] relative max-sm:p-4 max-lg:p-6 flex flex-col gap-2 p-10">
        <div className="hidden fixed z-30 w-full bg-white p-4 bottom-0 max-sm:left-0 gap-3 max-lg:flex max-lg:right-0 max-lg:w-130 max-sm:w-full max-sm:flex justify-between items-center">
          {renderTagAndPrice()}
          {course.enrolled ? (
            <button
              onClick={() => navigate(`/my-courses/${courseId}`)}
              className="w-full text-white py-3 bg-[#68049B] font-bold rounded-md"
            >
              View Enrolled Course
            </button>
          ) : (
            <button
              onClick={handleEnrollClick}
              disabled={isEnrollButtonLoading}
              className="w-full text-white py-3 bg-[#68049B] font-bold rounded-md disabled:opacity-50"
            >
              {isEnrollButtonLoading ? <span className="loader"></span> : 'Enroll Now'}
            </button>
          )}
        </div>
        <div
          onClick={() => navigate('/courses/course')}
          className="cursor-pointer w-10 min-h-10 rotate-180 bg-gray-300 rounded-full flex items-center justify-center"
        >
          <ForwardArrowSVG size={13} />
        </div>
        <h1 className="text-xl font-bold">{course.title}</h1>
        <div className="w-full min-h-60 mb-5 rounded-lg bg-gray-200">
          {course.image && (
            <img src={course.image} alt={course.title} className="w-full h-full object-cover rounded-lg" />
          )}
        </div>
        <p className="text-sm font-bold">{course.subtitle}</p>
        <p className="text-xs">{course.description}</p>
        <div className="w-full max-sm:flex max-lg:flex sticky mt-4 top-5 rounded-lg bg-white p-5 hidden gap-2 flex-col">
          <p className="text-lg font-bold">Course Includes</p>
          <DynamicRow icon={<TimerSVG size={15} />} text="Duration TBD" />
          <DynamicRow icon={<ListSVG size={15} />} text={`${course.lesson_count} Lessons`} />
          <DynamicRow icon={<CertificateSVG size={15} />} text="Certificate of Completion" />
        </div>
        <div className="w-full mt-5 max-sm:pb-20 flex flex-col gap-2">
          <h1 className="text-xl font-bold">Course Curriculum</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold">Beginner</p>
              <div className="w-1 h-1 rounded-full bg-gray-700" />
              <p className="text-xs font-bold">Finance</p>
            </div>
            <p className="text-xs font-bold">Duration TBD</p>
          </div>
          <div className="flex flex-col gap-4 mt-4 mb-8">
            {course.sections.map((section) => {
              console.log('Section lessons count:', section.lessons.length);
              return (
                <DropDownComponents
                  key={section.id}
                  id={`section-${section.id}`}
                  numberOfLessons={section.lessons.length.toString()}
                  title={section.title}
                  totalTime="TBD"
                  dropDownItems={section.lessons.map((lesson) => ({
                    title: lesson.title,
                    time: '-'
                  }))}
                />
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex-[3] max-sm:hidden max-lg:hidden mt-31 h-auto">
        <div className="w-[70%] max-lg:w-[95%] sticky top-5 rounded-lg bg-white p-5 flex gap-2 flex-col">
          {renderTagAndPrice()}
          {course.enrolled ? (
            <button
              onClick={() => navigate(`/my-courses/${courseId}`)}
              className="w-full text-white py-3 bg-[#68049B] font-bold rounded-md"
            >
              View Enrolled Course
            </button>
          ) : (
            <button
              onClick={handleEnrollClick}
              disabled={isEnrollButtonLoading}
              className="w-full text-white py-3 bg-[#FFD30F] font-bold rounded-md disabled:opacity-50"
            >
              {isEnrollButtonLoading ? <span className="loader"></span> : 'Enroll Now'}
            </button>
          )}
          <p className="text-sm mt-4 font-medium">Course Includes</p>
          <DynamicRow icon={<TimerSVG size={15} />} text="Duration TBD" />
          <DynamicRow icon={<ListSVG size={15} />} text={`${course.lesson_count} Lessons`} />
          <DynamicRow icon={<CertificateSVG size={15} />} text="Certificate of Completion" />
        </div>
      </div>
      <AlertMessage
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMsg}
        severity="purple"
      />
    </div>
  );
};

type RowProps = {
  icon: ReactNode;
  text: string;
};

const DynamicRow = (props: RowProps) => {
  return (
    <div className="w-full flex items-center gap-2">
      {props.icon}
      <p className="text-sm font-bold">{props.text}</p>
    </div>
  );
};

export default SingleCourse;