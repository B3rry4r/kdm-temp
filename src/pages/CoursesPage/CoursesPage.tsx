import { useState, useEffect } from 'react';
import { ChevronDownSVG } from '../../assets/icons/icons';
import CourseCard from './CourseComponents/CourseCard';
import { useAuth } from '../../context/AuthContext/AuthContext';
import AlertMessage from '../../components/AlertMessage';
import { useSearch } from '../../components/header/Header';

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
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const { searchQuery } = useSearch();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiClient.get<Course[]>('/courses');
        setCourses(response.data);
        alertSeverity;
      } catch (err: any) {
        console.error('Error fetching courses:', err.response?.data || err.message);
        setAlertMsg('Failed to load courses');
        setAlertSeverity('error');
        setAlertOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [apiClient]);

  useEffect(() => {
    if (courses.length > 0) {
      const filtered = courses.filter((course) => {
        const categoryMatches = 
          filter === 'All' ? true :
          filter === 'Free' ? course.type === filter :
          filter === 'Paid' ? course.type === filter :
          filter === 'Institution' ? (course.org_id !== null || course.type === 'Org') :
          true;
        
        const searchMatches = !searchQuery.trim() ? true : (
          (course.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           course.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        
        return categoryMatches && searchMatches;
      });
      
      setFilteredCourses(filtered);
      console.log('Filtered courses with search:', { filter, searchQuery, count: filtered.length });
    }
  }, [courses, filter, searchQuery]);

  if (isLoading) {
    return (
      <div className='w-full flex items-center justify-center h-full'>
        <div className='loader'></div>
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
      
      {searchQuery && (
        <div className="my-4">
          <p className="text-sm">
            Showing results for: <span className="font-semibold">{searchQuery}</span>
            {filter !== 'All' && <span> in <span className="font-semibold">{filter}</span></span>}
          </p>
        </div>
      )}
      
      {filteredCourses.length > 0 ? (
        <div className="w-full h-auto max-sm:grid-cols-1 max-lg:grid-cols-2 max-md:grid-cols-1 grid gap-3 mt-5 grid-cols-3">
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
      ) : (
        <div className="w-full text-center py-8">
          <p className="text-gray-500">No courses found matching your search.</p>
        </div>
      )}
      <AlertMessage open={alertOpen} message={alertMsg} severity="purple" onClose={() => setAlertOpen(false)} />
    </div>
  );
};

export default CoursesPage;