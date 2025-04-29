import { useState, useEffect } from 'react';
import { ChevronDownSVG } from '../../assets/icons/icons';
import CourseCard from './CourseComponents/CourseCard';
import { useAuth } from '../../context/AuthContext/AuthContext';

interface Course {
  id: number;
  title: string;
  description: string;
  image: string;
  type: string;
  price: string | number | null;
  org_id: number | null;
}

const CoursesPage = () => {
  const { apiClient } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiClient.get<Course[]>('/courses');
        console.log('Courses API response:', JSON.stringify(response.data, null, 2));
        setCourses(response.data);
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
    if (filter === 'Free') return course.type === 'Free';
    if (filter === 'Paid') return course.type === 'Paid';
    if (filter === 'Institution') return course.org_id !== null || course.type === 'Org';
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
    <div className='w-full relative p-10 max-sm:p-4 overflow-y-auto h-full'>
      <div className='flex flex-col gap-3'>
        <div className='flex flex-col gap-2'>
          <p className='text-xl font-bold'>All Courses</p>
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
              className={`text-xs font-bold cursor-pointer ${filter === 'Free' ? 'text-[#68049B]' : ''}`}
              onClick={() => setFilter('Free')}
            >
              Free
            </p>
            <p
              className={`text-xs font-bold cursor-pointer ${filter === 'Paid' ? 'text-[#68049B]' : ''}`}
              onClick={() => setFilter('Paid')}
            >
              Paid
            </p>
            <p
              className={`text-xs font-bold cursor-pointer ${filter === 'Institution' ? 'text-[#68049B]' : ''}`}
              onClick={() => setFilter('Institution')}
            >
              Institution
            </p>
          </div>
          <div className='right flex items-center max-sm:hidden gap-3'>
            <p className='text-xs font-light'>Sort by:</p>
            <p className='text-xs font-bold'>All</p>
            <ChevronDownSVG color='gray' size={12} />
          </div>
        </div>
      </div>
      <div className='w-full h-auto grid gap-3 mt-5 max-sm:grid-cols-1 grid-cols-3'>
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            id={course.id.toString()}
            title={course.title}
            desc={course.description.split('\n')[0]}
            imgSrc={course.image}
            tag={course.type}
            price={course.price}
            org_id={course.org_id}
          />
        ))}
      </div>
    </div>
  );
};

export default CoursesPage;