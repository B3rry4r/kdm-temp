import { useState, useEffect } from 'react';
import MyCourseCard from './CourseComponents/MyCourseCard';
import { useAuth } from '../../context/AuthContext/AuthContext';
import AlertMessage from '../../components/AlertMessage';
import { useSearch } from '../../components/header/Header';

interface Course {
  id: number;
  title: string;
  description: string;
  image: string;
  type: string;
  price: number | null;
  org_id: number | null;
  completion_percent: number;
  course_status: string;
}

interface MyCourseResponse {
  id: number;
  user_id: number;
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
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  const { searchQuery } = useSearch();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiClient.get<MyCourseResponse[]>('/my/courses');
        console.log('Raw API response:', response.data);
        
        // More cautious transformation of the data
        const transformedCourses = response.data.map(item => {
          // Check if properties exist before accessing
          const course = item.course || {};
          const id = item.course_id || course.id;
          const completion_percent = item.completion_percent || 0;
          const course_status = item.course_status || 'not-started';
          
          return {
            id: id,
            title: course.title || 'Untitled Course',
            description: course.description || 'No description available',
            image: course.image || '',
            type: course.type || 'Unknown',
            price: course.price,
            org_id: course.org_id,
            completion_percent: completion_percent,
            course_status: course_status
          };
        });
        
        console.log('Transformed courses:', transformedCourses);
        setCourses(transformedCourses);
      } catch (err: any) {
        console.error('Error fetching courses:', err.response?.data || err.message);
        setError('Failed to load courses');
        setAlertMsg('Failed to load courses');
        setAlertSeverity('error');
        setAlertOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [apiClient]);

  // Add a type guard function to validate the course object
  const isValidCourse = (course: any): course is Course => {
    return (
      course && 
      typeof course.id !== 'undefined'
      // Remove the other strict validations that are failing
    );
  };

  // Use the type guard and search query when filtering courses
  const filteredCourses = courses
    .filter(isValidCourse)
    .filter((course) => {
      // Filter by category
      const categoryMatches = 
        filter === 'All' ? true :
        filter === 'In Progress' ? course.course_status === 'in-progress' :
        filter === 'Not Started' ? course.course_status === 'not-started' :
        filter === 'Completed' ? course.course_status === 'completed' :
        true;
      
      // Filter by search query
      const searchMatches = !searchQuery.trim() ? true : (
        (course.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
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

  // If we have courses but no filtered courses, show a message
  if (courses.length > 0 && filteredCourses.length === 0) {
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
              <p
                className={`text-xs font-bold cursor-pointer ${filter === 'Not Started' ? 'text-[#68049B]' : ''}`}
                onClick={() => setFilter('Not Started')}
              >
                Not Started
              </p>
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
        <AlertMessage open={alertOpen} message={alertMsg} severity="purple" onClose={() => setAlertOpen(false)} />
      </div>
    );
  }

  // Optional: Add debug logging right before rendering the course list
  console.log('About to render courses:', filteredCourses);

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
            <p
              className={`text-xs font-bold cursor-pointer ${filter === 'Not Started' ? 'text-[#68049B]' : ''}`}
              onClick={() => setFilter('Not Started')}
            >
              Not Started
            </p>
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
              title={course.title || 'Untitled Course'}
              desc={(course.description && course.description.split('\n')[0]) || 'No description available'}
              imgSrc={course.image || ''}
              link={`/my-courses/${course.id}`}
              tag={course.price === null ? 'Free' : `₦${course.price}`}
              isStyleTwo={true}
              completionPercent={course.completion_percent}
            />
          ) : null
        ))}
      </div>
      <AlertMessage open={alertOpen} message={alertMsg} severity="purple" onClose={() => setAlertOpen(false)} />
    </div>
  );
};

export default MyCoursesPage;