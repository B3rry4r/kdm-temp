import { useState, useEffect } from 'react';
import MyCourseCard from './CourseComponents/MyCourseCard';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useSearch } from '../../components/header/Header';

interface Course {
  id: number;
  course_title: string;
  description: string;
  course_image: string;
  type: string;
  price: number | null;
  org_id: number | null;
  completion_percent: number;
  course_status: string;
}

interface MyCourseResponse {
  id: number;
  user_id: number;
  course_title: string;
  description: string;
  course_image: string;
  course_id: number;
  created_at: string;
  completion_percent: number;
  course_status: string;
  course: Omit<Course, 'completion_percent' | 'course_status'>;
}

const MyCoursesPage = () => {
  const { apiClient } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { searchQuery } = useSearch();

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get<MyCourseResponse[]>('/my/courses');
      console.log('Raw API response:', response.data);
      
      const transformedCourses = response.data.map(item => {
        const course = item.course || {};
        const id = item.course_id;
        const completion_percent = item.completion_percent || 0;
        const course_status = item.course_status || 'not-started';
        console.log( 'TEST COURSE TITLE', item.course_title);
        return {
          id: id,
          course_title: item.course_title || 'Untitled Course',
          description: item.description || 'No description available',
          course_image: item.course_image || '',
          type: course.type || 'Unknown',
          price: course.price,
          org_id: course.org_id,
          completion_percent: completion_percent,
          course_status: course_status
        };
      });
      
      console.log('Transformed courses:', transformedCourses);
      setCourses(transformedCourses);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching courses:', err.response?.data || err.message);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [apiClient]);

  const isValidCourse = (course: any): course is Course => {
    return course && typeof course.id !== 'undefined';
  };

  // Helper function to determine button text based on course status
  const getButtonText = (course: Course): string => {
    if (course.course_status === 'in-progress' && course.completion_percent === 0) {
      return 'Start Course';
    }
    switch (course.course_status) {
      case 'in-progress':
        return 'Continue Course';
      case 'completed':
        return 'View Course';
      case 'not-started':
        return 'Start Course';
      default:
        return 'Start Course'; // Fallback for unexpected status
    }
  };

  const filteredCourses = courses
    .filter(isValidCourse)
    .filter((course) => {
      const categoryMatches = 
        filter === 'All' ? true :
        filter === 'In Progress' ? course.course_status === 'in-progress' :
        // filter === 'Not Started' ? course.course_status === 'not-started' :
        filter === 'Completed' ? course.course_status === 'completed' :
        true;
      
      const searchMatches = !searchQuery.trim() ? true : (
        (course.course_title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         course.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      return categoryMatches && searchMatches;
    });

  console.log('Current filter:', filter);
  console.log('Filtered courses:', filteredCourses);

  if (isLoading) {
    return (
      <div className='w-full flex items-center justify-center h-full'>
        <div className='loader'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='w-full relative max-sm:p-4 p-10 overflow-y-auto h-full'>
        <div className='flex flex-col gap-3'>
          <p className='text-xl font-bold'>My Courses</p>
          <div className='mt-8 text-center'>
            <p className='text-lg text-red-600'>{error}</p>
            <button
              className='mt-4 px-4 py-2 bg-[#68049B] text-white rounded'
              onClick={() => {
                setIsLoading(true);
                setError(null);
                fetchCourses();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!courses.length) {
    return (
      <div className='w-full relative max-sm:p-4 p-10 overflow-y-auto h-full'>
        <div className='flex flex-col gap-3'>
          <p className='text-xl font-bold'>My Courses</p>
          <div className='mt-8 text-center'>
            <p className='text-sm'>No courses available.</p>
            <p className='text-sm mt-2'>You haven’t enrolled in any courses yet.</p>
          </div>
        </div>
      </div>
    );
  }

  if (filteredCourses.length === 0) {
    return (
      <div className='w-full relative max-sm:p-4 p-10 overflow-y-auto h-full'>
        <div className='flex flex-col gap-3'>
          <div className='flex flex-col gap-2'>
            <p className='text-xl font-bold'>My Courses</p>
          </div>
          <div className='filters sticky top-[69px] w-full flex items-center justify-between border-b border-gray-200 pb-2 gap-2'>
            <div className='left flex items-center gap-3'>
              <p
                className={`text-xs font-bold cursor-pointer ${filter === 'All' ? 'text-[#68049B]' : ''}`}
                onClick={() => setFilter('All')}
              >
                All
              </p>
              <p
                className={`text-xs font-bold cursor-pointer ${filter === 'In Progress' ? 'text-[#68049B]' : ''}`}
                onClick={() => setFilter('In Progress')}
              >
                In Progress
              </p>
              {/* <p
                className={`text-xs font-bold cursor-pointer ${filter === 'Not Started' ? 'text-[#68049B]' : ''}`}
                onClick={() => setFilter('Not Started')}
              >
                Not Started
              </p> */}
              <p
                className={`text-xs font-bold cursor-pointer ${filter === 'Completed' ? 'text-[#68049B]' : ''}`}
                onClick={() => setFilter('Completed')}
              >
                Completed
              </p>
            </div>
          </div>
        </div>
        <div className='mt-8 text-center'>
          {searchQuery ? (
            <p className='text-sm'>No courses found for '{searchQuery}' in '{filter}' filter.</p>
          ) : (
            <p className='text-sm'>No courses found for '{filter}' filter.</p>
          )}
          <p className='text-sm mt-2'>Try selecting a different filter or check back later.</p>
        </div>
      </div>
    );
  }

  console.log('About to render courses:', filteredCourses.map(course => ({
    id: course.id,
    title: course.course_title,
    status: course.course_status,
    buttonText: getButtonText(course)
  })));

  return (
    <div className='w-full relative max-sm:p-4 p-10 overflow-y-auto h-full'>
      <div className='flex flex-col gap-3'>
        <div className='flex flex-col gap-2'>
          <p className='text-xl font-bold'>My Courses</p>
        </div>
        <div className='filters sticky top-[69px] w-full flex items-center justify-between border-b border-gray-200 pb-2 gap-2'>
          <div className='left flex items-center gap-3'>
            <p
              className={`text-xs font-bold cursor-pointer ${filter === 'All' ? 'text-[#68049B]' : ''}`}
              onClick={() => setFilter('All')}
            >
              All
            </p>
            <p
              className={`text-xs font-bold cursor-pointer ${filter === 'In Progress' ? 'text-[#68049B]' : ''}`}
              onClick={() => setFilter('In Progress')}
            >
              In Progress
            </p>
            {/* <p
              className={`text-xs font-bold cursor-pointer ${filter === 'Not Started' ? 'text-[#68049B]' : ''}`}
              onClick={() => setFilter('Not Started')}
            >
              Not Started
            </p> */}
            <p
              className={`text-xs font-bold cursor-pointer ${filter === 'Completed' ? 'text-[#68049B]' : ''}`}
              onClick={() => setFilter('Completed')}
            >
              Completed
            </p>
          </div>
        </div>
      </div>
      
      {searchQuery && (
        <div className="my-3">
          <p className="text-sm">
            Showing results for: <span className="font-semibold">{searchQuery}</span>
            {filter !== 'All' && <span> in <span className="font-semibold">{filter}</span></span>}
          </p>
        </div>
      )}
      
      <div className='w-full h-auto max-sm:grid-cols-1 max-lg:grid-cols-2 max-md:grid-cols-1 grid gap-3 mt-5 grid-cols-3'>
        {filteredCourses.map((course) => (
          course && course.id ? (
            <MyCourseCard
              key={course.id}
              id={course.id.toString()}
              title={course.course_title || 'Untitled Course'}
              desc={(course.description && course.description.split('\n')[0]) || 'No description available'}
              imgSrc={course.course_image || ''}
              link={`/my-courses/${course.id}`}
              tag={course.price === null ? 'Free' : `₦${course.price}`}
              isStyleTwo={true}
              completionPercent={course.completion_percent}
              buttonText={getButtonText(course)}
            />
          ) : null
        ))}
      </div>
    </div>
  );
};

export default MyCoursesPage;