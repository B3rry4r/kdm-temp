import { useState, useEffect } from 'react';
import MyCourseCard from './CourseComponents/MyCourseCard';
import { useAuth } from '../../context/AuthContext/AuthContext';

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

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiClient.get<MyCourseResponse[]>('/my/courses');
        console.log('My Courses API response:', JSON.stringify(response.data, null, 2));
        setCourses(response.data.map(item => ({
          ...item.course,
          completion_percent: item.completion_percent,
          course_status: item.course_status,
        })));
      } catch (err: any) {
        console.error('Error fetching courses:', err.response?.data || err.message);
        setError('Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [apiClient]);

  const filteredCourses = courses.filter((course) => {
    if (filter === 'All') return true;
    if (filter === 'In Progress') return course.course_status === 'in-progress';
    if (filter === 'Not Started') return course.course_status === 'not-started';
    if (filter === 'Completed') return course.course_status === 'completed';
    return true;
  });

  if (isLoading) {
    return (
      <div className='w-full flex items-center justify-center h-full'>
        <div className='loader'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='w-full flex items-center justify-center h-full'>
        <p className='text-[#68049B] text-xs'>{error}</p>
      </div>
    );
  }

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
      <div className='w-full h-auto max-sm:grid-cols-1 grid gap-3 mt-5 grid-cols-3'>
        {filteredCourses.map((course) => (
          <MyCourseCard
            key={course.id}
            id={course.id.toString()}
            title={course.title}
            desc={course.description.split('\n')[0]}
            imgSrc={course.image}
            link={`/my-courses/${course.id}`}
            tag={course.price === null ? 'Free' : `₦${course.price}`}
            isStyleTwo={true}
            completionPercent={course.completion_percent}
          />
        ))}
      </div>
    </div>
  );
};

export default MyCoursesPage;