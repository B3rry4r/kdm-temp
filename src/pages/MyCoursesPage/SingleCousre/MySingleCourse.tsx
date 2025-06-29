import { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCourseCertificate } from '../../../context/CourseCertificateContext';
import { ForwardArrowSVG } from '../../../assets/icons/icons';
import DropDownComponents from './DropDownComponents/DropDownComponents';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import AlertMessage from '../../../components/AlertMessage';
import { useCourseProgress } from '../../../context/CourseProgressContext/CourseProgressContext';
import { useCourseSummary } from '../../../context/CourseSummaryContext/CourseSummaryContext';

// Define types based on API response
interface Lesson {
  id: number;
  section_id: number;
  type: number; // 1 = document, 2 = video
  title: string;
  body: string;
  video: string;
  files: string;
  file_urls: string[];
}

interface Section {
  id: number;
  course_id: number;
  title: string;
  lessons: Lesson[];
}

interface QuizSettings {
  id: number;
  course_id: number;
  passmark: number;
  duration: number;
}

interface Course {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  video: string;
  type: string;
  price: number | null;
  org_id: number | null;
  status: string;
  created_at: string;
  section_count: number;
  lesson_count: number;
  enrolled: boolean;
  sections: Section[];
  quiz_settings: QuizSettings;
  completion_percent?: number; // Optional, not in API response
  course_status?: string; // Optional, not in API response
}

interface DropDownItemType {
  title: string;
  time: string;
  type: 'video' | 'document';
  isCompleted: boolean;
}

interface CourseSectionOverview {
  id: string;
  title: string;
  numberOfLessons: string;
  totalTime: string;
  dropDownItems: DropDownItemType[];
}

const MySingleCourse = () => {
  const { setCertificateCourseTitle } = useCourseCertificate();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { apiClient, apiClient4, user: authUser } = useAuth();
  const { courseSummaries } = useCourseSummary();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  
  // Use the course progress context
  const { 
    getLessonStatus, 
    getCourseProgress 
  } = useCourseProgress();
  
  // Parsed course ID for context functions
  const courseId = id ? parseInt(id) : 0;

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) {
        setError('Invalid course ID');
        alertSeverity;
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await apiClient.get<Course>(`/course/${id}`);
        // Try to get summary from context, then localStorage
        let summary = courseSummaries[Number(id)];
        if (!summary) {
          const local = localStorage.getItem(`selected_course_summary_${id}`);
          if (local) {
            try {
              summary = JSON.parse(local);
            } catch {}
          }
        }
        const completion_percent = summary && typeof summary.completion_percent === 'number' ? summary.completion_percent : 0;
        setCourse({
          ...response.data,
          completion_percent,
          course_status: summary && summary.course_status ? summary.course_status : response.data.course_status,
        });
        // Set course title in certificate context if completed
        if (completion_percent === 100) {
          setCertificateCourseTitle(response.data.title);
        } else {
          setCertificateCourseTitle(null);
        }
      } catch (err: any) {
        console.error('Error fetching course:', err.response?.data || err.message);
        setError('Failed to load course');
        setAlertMsg('Failed to load course');
        setAlertSeverity('error');
        setAlertOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [apiClient, id, getCourseProgress]);



  const handleStartCourse = () => {
    navigate(`/started-course/${id}`);
  };

  const getButtonText = (completionPercent: number): string => {
    if (completionPercent === 0) {
      return 'Start Course';
    }
    if (completionPercent > 0 && completionPercent < 100) {
      return 'Continue Course';
    }
    return 'View Course';
  };

  const handlePayForCertificate = async () => {
    if (!authUser) {
      setAlertMsg('You must be logged in to purchase a certificate.');
      setAlertSeverity('error');
      setAlertOpen(true);
      return;
    }
    try {
      // You may want to get this from a config or env
      const amount = 1000;
      // Use your actual API base URL for redirect
      const apiBaseUrl = window.location.origin;
      const redirect_url = `${apiBaseUrl}/lms/certificate-download`;
      const payload = {
        amount,
        redirect_url,
        email: authUser.email,
        phone: authUser.phone || '',
        name: `${authUser.firstname} ${authUser.lastname}`,
      };
      const response = await apiClient4.post('/payment/link', payload);
      if (response?.data?.payment_link) {
        window.location.href = response.data.payment_link;
      } else {
        setAlertMsg('Unable to initiate payment. Please try again.');
        setAlertSeverity('error');
        setAlertOpen(true);
      }
    } catch (error: any) {
      setAlertMsg(error?.response?.data?.message || 'Payment initiation failed.');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  // Helper to estimate lesson time (since API doesn't provide it)
  const estimateLessonTime = (lesson: Lesson): string => {
    if (lesson.type === 1) return '15mins'; // Documents
    if (lesson.video !== '-') return '30mins'; // Videos with content
    return '20mins'; // Default
  };

  // Helper to calculate total section time
  const calculateTotalTime = (lessons: Lesson[]): string => {
    const totalMinutes = lessons.reduce((sum, lesson) => {
      const timeStr = estimateLessonTime(lesson);
      const minutes = parseInt(timeStr.replace('mins', '')) || 0;
      return sum + minutes;
    }, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}hr ${minutes}mins` : `${minutes}mins`;
  };

  // Map sections to CourseSectionOverview with completion status from context
  const courseSections: CourseSectionOverview[] = course?.sections?.map(section => {
    // Get section progress percentage from context
    // const sectionProgress = getSectionProgress(courseId, section.id);
    
    return {
      id: `section-${section.id}`,
      title: section.title,
      numberOfLessons: section.lessons.length.toString(),
      totalTime: calculateTotalTime(section.lessons),
      // Update with completion status from context
      dropDownItems: section.lessons.map(lesson => ({
        title: lesson.title,
        time: estimateLessonTime(lesson),
        type: lesson.type === 1 ? 'document' : 'video',
        isCompleted: getLessonStatus(courseId, section.id, lesson.id), // Use tracked status
      })),
    };
  }) || [];

  if (isLoading) {
    return (
      <div className='w-full flex items-center justify-center h-full'>
        <div className='loader'></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className='w-full flex items-center justify-center h-full'>
        <p className='text-[#68049B] text-xs'>{error || 'Course not found'}</p>
      </div>
    );
  }

  return (
    <div className='flex overflow-y-auto flex-col max-lg:p-6 max-sm:p-4 p-10 h-full w-full'>
      <div
        onClick={() => navigate(-1)}
        className='cursor-pointer w-10 min-h-10 rotate-180 bg-gray-300 rounded-full flex items-center justify-center'
      >
        <ForwardArrowSVG size={13} />
      </div>
      <div className='w-full mt-7 items-center flex flex-col'>
        <div className='w-[80%] max-lg:w-full max-lg:p-0 max-sm:w-full flex flex-col gap-2 max-sm:p-4 p-10'>
          <h1 className='text-2xl mb-4 max-sm:mb-0 font-bold'>Welcome {authUser?.firstname || 'User'}</h1>
          <h1 className='text-xl my-5 font-bold'>{getButtonText(course.completion_percent || 0)}</h1>
          <div className='w-full min-h-60 max-sm:min-h-100 mb-5 p-5 max-sm:flex-col flex rounded-lg bg-white'>
            <div className='w-[40%] h-[100%] max-sm:w-full max-sm:h-[50%] overflow-hidden flex rounded-lg bg-gray-200'>
              <img src={course.image} alt={course.title} className='w-full h-full object-cover rounded-lg' />
            </div>
            <div className='w-[60%] h-full max-sm:w-full max-sm:h-[50%] p-5 flex flex-col justify-between gap-4'>
              <h1 className='text-xl my-5 max-sm:my-2 font-bold'>{course.title}</h1>
              <div className='flex flex-col gap-1'>
                <div className='w-full rounded-2xl h-1 bg-gray-300'>
                  <div
                    className='h-full rounded-2xl bg-[#68049B]'
                    style={{ width: `${course.completion_percent || 0}%` }}
                  ></div>
                </div>
                <p className='text-xs text-gray-400'>{course.completion_percent || 0}% Completed</p>
              </div>
              <div className='w-full flex flex-col sm:flex-row gap-3'>
                <button
                  onClick={handleStartCourse}
                  className='w-full sm:w-auto flex-grow bg-[#FFD30F] cursor-pointer rounded-lg font-bold text-xs px-4 py-3'
                >
                  {getButtonText(course.completion_percent || 0)}
                </button>
                {course.completion_percent === 100 && (
                  <button
                    onClick={handlePayForCertificate}
                    className='w-full sm:w-auto flex-grow bg-[#68049B] text-white rounded-lg font-bold text-xs px-4 py-3'
                  >
                    Pay for Certificate
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className='w-full mt-5 flex flex-col gap-2'>
            <h1 className='text-xl font-bold'>Course Curriculum</h1>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <p className='text-xs font-bold'>{course.section_count} sections</p>
                <div className='w-1 h-1 rounded-full bg-gray-700' />
                <p className='text-xs font-bold'>{course.lesson_count} lessons</p>
                <div className='w-1 h-1 rounded-full bg-gray-700' />
                <p className='text-xs font-bold'>{calculateTotalTime(course.sections.flatMap(s => s.lessons))}</p>
              </div>
              <p className='text-xs max-sm:hidden font-bold'>Collapse All Sections</p>
            </div>
            <div className='flex flex-col gap-4 mt-4 mb-8'>
              {courseSections.map(section => (
                <DropDownComponents
                  isUserOwned={true}
                  key={section.id}
                  id={section.id}
                  numberOfLessons={section.numberOfLessons}
                  title={section.title}
                  totalTime={section.totalTime}
                  dropDownItems={section.dropDownItems}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <AlertMessage open={alertOpen} message={alertMsg} severity="purple" onClose={() => setAlertOpen(false)} />
    </div>
  );
};

type RowProps = {
  icon: ReactNode;
  text: string;
};

export const DynamicRow = (props: RowProps) => {
  return (
    <div className='w-full flex items-center gap-2'>
      <div className="w-5 flex items-center justify-center">
      {props.icon}
      </div>
      <p className='text-sm font-bold'>{props.text}</p>
    </div>
  );
};

export default MySingleCourse;