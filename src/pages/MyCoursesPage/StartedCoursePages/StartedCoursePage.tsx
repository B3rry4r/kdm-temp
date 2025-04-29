import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../../components/header/Header';
import { ForwardArrowSVG } from '../../../assets/icons/icons';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { Play, Pause } from 'lucide-react';
import DropDownComponents from '../SingleCousre/DropDownComponents/DropDownComponents';
import QuizDropDownComponents from '../SingleCousre/DropDownComponents/QuizDropDownComponent';

const contentOuterClasses = 'w-full max-sm:pr-0 h-full pr-60 flex flex-col';
const contentHeaderClasses = 'w-full max-sm:px-4 max-sm:py-0 max-sm:pb-10 px-20 border-b border-gray-300 py-20';
const contentButtonContainerClasses = 'flex items-center justify-center p-4';

interface CourseProps {
  title: string;
  description: string;
  videoUrl: string;
  onComplete: () => void;
  onPreviousLesson: () => void;
  onNextLesson: () => void;
}

const CourseComponent: React.FC<CourseProps> = ({ title, description, videoUrl, onComplete, onPreviousLesson, onNextLesson }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className={contentOuterClasses}>
      <div className={contentHeaderClasses}>
        <div className='flex justify-between mb-6 items-center'>
          <div>
            <h1 className='font-bold'>{title}</h1>
            <p className='text-xs text-gray-700 mt-2'>{description}</p>
          </div>
          <div className='flex items-center gap-2'>
            <div onClick={onPreviousLesson} className='items-center p-2 cursor-pointer bg-gray-200 rounded-full rotate-180 flex w-7 h-7 justify-center'>
              <ForwardArrowSVG size={13} />
            </div>
            <div onClick={onNextLesson} className='items-center p-2 cursor-pointer bg-gray-200 rounded-full flex w-7 h-7 justify-center'>
              <ForwardArrowSVG size={13} />
            </div>
          </div>
        </div>
        <div className='w-full h-80 max-sm:h-60 relative'>
          <video
            ref={videoRef}
            src={videoUrl}
            className='w-full h-full object-cover'
            onEnded={() => setIsPlaying(false)}
          />
          <button
            onClick={togglePlayPause}
            className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#68049B] rounded-full p-2 opacity-70 hover:opacity-100 transition-opacity duration-200'
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isPlaying ? (
              <Pause size={18} color='white' />
            ) : (
              <Play size={18} color='white' />
            )}
          </button>
        </div>
      </div>
      <div className={contentButtonContainerClasses}>
        <button onClick={onComplete} className='py-2 px-4 rounded-lg text-xs bg-[#FFD30F] font-bold'>
          Complete and Continue
        </button>
      </div>
    </div>
  );
};

interface DocumentProps {
  documentTitle: string;
  documentDescription: string;
  documentUrl: string;
  onComplete: () => void;
  onPreviousLesson: () => void;
  onNextLesson: () => void;
}

const DocumentComponent: React.FC<DocumentProps> = ({
  documentTitle,
  documentDescription,
  documentUrl,
  onComplete,
  onPreviousLesson,
  onNextLesson,
}) => (
  <div className={contentOuterClasses}>
    <div className={contentHeaderClasses}>
      <div className='flex justify-between mb-6 items-center'>
        <div>
          <h1 className='font-bold'>{documentTitle}</h1>
          <p className='text-xs text-gray-700 mt-2'>{documentDescription}</p>
        </div>
        <div className='flex items-center gap-2'>
          <div onClick={onPreviousLesson} className='items-center p-2 cursor-pointer bg-gray-200 rounded-full rotate-180 flex w-7 h-7 justify-center'>
            <ForwardArrowSVG size={13} />
          </div>
          <div onClick={onNextLesson} className='items-center p-2 cursor-pointer bg-gray-200 rounded-full flex w-7 h-7 justify-center'>
            <ForwardArrowSVG size={13} />
          </div>
        </div>
      </div>
      <div className='w-full h-auto py-5 pr-15 rounded-lg flex text-gray-700'>
        <p className='text-xs'>{documentDescription}</p>
      </div>
      {documentUrl && (
        <a
          href={documentUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='text-xs px-4 py-2 flex items-center gap-2 w-50 rounded-lg font-bold justify-center bg-gray-200'
        >
          Download Exercise
        </a>
      )}
    </div>
    <div className={contentButtonContainerClasses}>
      <button onClick={onComplete} className='py-2 px-4 rounded-lg text-xs bg-[#FFD30F] font-bold'>
        Complete and Continue
      </button>
    </div>
  </div>
);

interface QuizScore {
  course_id: number;
  score: number;
  correct: number;
  incorrect: number;
}

interface QuizProps {
  quizTitle: string;
  isLocked: boolean;
  passmark: number;
  duration: number;
  courseId: number;
  onPreviousLesson: () => void;
  onNextLesson: () => void;
  onStartQuiz: () => void;
}

const QuizComponent: React.FC<QuizProps> = ({ quizTitle, isLocked, passmark, duration, courseId, onPreviousLesson, onNextLesson, onStartQuiz }) => {
  const { apiClient } = useAuth();
  const [quizScore, setQuizScore] = useState<QuizScore | null>(null);
  const [loadingScore, setLoadingScore] = useState(true);

  useEffect(() => {
    const fetchQuizScore = async () => {
      try {
        setLoadingScore(true);
        const response = await apiClient.get<QuizScore>(`/course/quiz/score/${courseId}`);
        setQuizScore(response.data);
      } catch (err: any) {
        console.error('Error fetching quiz score:', err.response?.data || err.message);
        setQuizScore(null); // No score available
      } finally {
        setLoadingScore(false);
      }
    };

    if (!isLocked) {
      fetchQuizScore();
    }
  }, [courseId, isLocked, apiClient]);

  if (isLocked) {
    return (
      <div className={contentOuterClasses}>
        <div className={contentHeaderClasses}>
          <div className='flex justify-between mb-6 items-center'>
            <h1 className='font-bold'>{quizTitle}</h1>
            <div className='flex items-center gap-2'>
              <div onClick={onPreviousLesson} className='items-center p-2 cursor-pointer bg-gray-200 rounded-full rotate-180 flex w-7 h-7 justify-center'>
                <ForwardArrowSVG size={13} />
              </div>
              <div onClick={onNextLesson} className='items-center p-2 cursor-pointer bg-gray-200 rounded-full flex w-7 h-7 justify-center'>
                <ForwardArrowSVG size={13} />
              </div>
            </div>
          </div>
          <div className='w-full h-auto py-5 rounded-lg flex flex-col items-center justify-center text-grayboreder-gray-700 gap-3'>
            <div className='w-50 h-50 rounded-full bg-gray-300' />
            <p className='font-bold text-lg'>Locked</p>
            <p className='font-medium text-xs'>Complete all lessons to unlock</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={contentOuterClasses}>
      <div className={contentHeaderClasses}>
        <div className='flex justify-between mb-6 items-center'>
          <h1 className='font-bold'>{quizTitle}</h1>
          <div className='flex items-center gap-2'>
            <div onClick={onPreviousLesson} className='items-center p-2 cursor-pointer bg-gray-200 rounded-full rotate-180 flex w-7 h-7 justify-center'>
              <ForwardArrowSVG size={13} />
            </div>
            <div onClick={onNextLesson} className='items-center p-2 cursor-pointer bg-gray-200 rounded-full flex w-7 h-7 justify-center'>
              <ForwardArrowSVG size={13} />
            </div>
          </div>
        </div>
        <div className='w-full py-5 rounded-lg flex flex-col gap-8 items-center justify-between text-gray-700'>
          <div className='w-full flex items-center justify-between'>
            <p className='text-xs'>Pass to get certificate</p>
            <button onClick={onStartQuiz} className='py-2 px-4 rounded-lg text-xs bg-[#FFD30F] font-bold'>
              Start Quiz
            </button>
          </div>
          <div className='w-full p-18 max-sm:p-8 bg-white max-sm:bg-gray-200 flex-col flex rounded-2xl'>
            <div className='flex items-center justify-between'>
              <p className='text-3xl max-sm:text-xl font-bold'>{passmark}% or Higher</p>
              <p className='text-xs font-bold'>
                {loadingScore ? '-' : quizScore ? `${quizScore.score}%` : '-'}
              </p>
            </div>
            <div className='w-[1px] h-full hidden max-sm:flex rounded-lg bg-gray-300'></div>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-bold text-gray-600'>Grade to Pass</p>
              <p className='text-xs font-bold text-gray-600'>Your Grade</p>
            </div>
            <div className='flex items-center justify-between mt-2'>
              <p className='text-xs font-bold text-gray-600'>Duration: {duration} mins</p>
              {quizScore && (
                <p className='text-xs font-bold text-gray-600'>
                  Correct: {quizScore.correct} | Incorrect: {quizScore.incorrect}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// API types
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
  quiz_settings: QuizSettings | null;
}

// Component types
interface CourseLessonItem {
  title: string;
  time: string;
  type: 'video' | 'document';
  isCompleted: boolean;
}

interface CourseSection {
  id: string;
  title: string;
  numberOfLessons: string;
  totalTime: string;
  dropDownItems: CourseLessonItem[];
}

interface QuizItem {
  title: string;
  time: string;
  type: 'quiz';
  isCompleted: boolean;
}

interface ActiveLessonState {
  sectionId: string;
  lessonIndex: number;
  isQuiz: boolean;
}

const StartedCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { apiClient } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<ActiveLessonState | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await apiClient.get<Course>(`/course/${id}`);
        console.log('Course API response:', JSON.stringify(response.data, null, 2));
        setCourse(response.data);
      } catch (err: any) {
        console.error('Error fetching course:', err.response?.data || err.message);
        setError('Failed to load course');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [apiClient, id]);

  // Helper to estimate lesson time
  const estimateLessonTime = (lesson: Lesson): string => {
    if (lesson.type === 1) return '15mins'; // Documents
    if (lesson.video !== '-') return '30mins'; // Videos
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

  // Map API data to courseSections and quiz
  const courseSections: CourseSection[] = useMemo(
    () =>
      course?.sections?.map(section => ({
        id: `section-${section.id}`,
        title: section.title,
        numberOfLessons: section.lessons.length.toString(),
        totalTime: calculateTotalTime(section.lessons),
        dropDownItems: section.lessons.map((lesson, idx) => ({
          title: lesson.title,
          time: estimateLessonTime(lesson),
          type: lesson.type === 1 ? 'document' : 'video',
          isCompleted: completedLessons.get(`section-${section.id}-${idx}`) || false,
        })),
      })) || [],
    [course, completedLessons]
  );

  const quizItem: QuizItem | null = useMemo(
    () =>
      course?.quiz_settings
        ? {
            title: 'Course Quiz',
            time: `${course.quiz_settings.duration}mins`,
            type: 'quiz',
            isCompleted: completedLessons.get('quiz-0') || false,
          }
        : null,
    [course, completedLessons]
  );

  useEffect(() => {
    if (courseSections.length && !activeLesson) {
      setActiveLesson({ sectionId: courseSections[0].id, lessonIndex: 0, isQuiz: false });
      const initial = new Map<string, boolean>();
      courseSections.forEach(section => {
        section.dropDownItems.forEach((_, idx) => initial.set(`${section.id}-${idx}`, false));
      });
      if (course?.quiz_settings) {
        initial.set('quiz-0', false);
      }
      setCompletedLessons(initial);
    }
  }, [courseSections, activeLesson, course]);

  const handleLessonCompleted = (sectionId: string, lessonIndex: number, isQuiz: boolean) => {
    const key = isQuiz ? 'quiz-0' : `${sectionId}-${lessonIndex}`;
    if (!completedLessons.get(key)) {
      setCompletedLessons(prev => new Map(prev).set(key, true));
      if (!isQuiz) goToNextLesson();
    }
  };

  const goToNextLesson = () => {
    if (!activeLesson) return;
    const { sectionId, lessonIndex, isQuiz } = activeLesson;
    if (isQuiz) return;
    const secIdx = courseSections.findIndex(s => s.id === sectionId);
    const section = courseSections[secIdx];
    if (lessonIndex < section.dropDownItems.length - 1) {
      setActiveLesson({ sectionId, lessonIndex: lessonIndex + 1, isQuiz: false });
    } else if (secIdx < courseSections.length - 1) {
      const next = courseSections[secIdx + 1];
      setActiveLesson({ sectionId: next.id, lessonIndex: 0, isQuiz: false });
    } else if (course?.quiz_settings) {
      setActiveLesson({ sectionId: 'quiz', lessonIndex: 0, isQuiz: true });
    }
  };

  const goToPreviousLesson = () => {
    if (!activeLesson) return;
    const { sectionId, lessonIndex, isQuiz } = activeLesson;
    if (isQuiz && course?.quiz_settings) {
      const lastSection = courseSections[courseSections.length - 1];
      setActiveLesson({ sectionId: lastSection.id, lessonIndex: lastSection.dropDownItems.length - 1, isQuiz: false });
      return;
    }
    const secIdx = courseSections.findIndex(s => s.id === sectionId);
    if (lessonIndex > 0) {
      setActiveLesson({ sectionId, lessonIndex: lessonIndex - 1, isQuiz: false });
    } else if (secIdx > 0) {
      const prev = courseSections[secIdx - 1];
      setActiveLesson({ sectionId: prev.id, lessonIndex: prev.dropDownItems.length - 1, isQuiz: false });
    }
  };

  const checkQuizLocked = () => {
    if (!course?.quiz_settings) return true;
    for (const section of courseSections) {
      for (let j = 0; j < section.dropDownItems.length; j++) {
        if (!completedLessons.get(`${section.id}-${j}`)) return true;
      }
    }
    return false;
  };

  const activeLessonData = activeLesson
    ? activeLesson.isQuiz && course?.quiz_settings
      ? quizItem
      : courseSections.find(s => s.id === activeLesson.sectionId)?.dropDownItems[activeLesson.lessonIndex]
    : null;

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
    <div className='w-full'>
      <div
        className='w-11 h-11 items-center justify-center rounded-full hidden max-sm:flex fixed p-3 top-1 left-2 z-999 flex-col gap-1'
        onClick={() => {
          setIsActive(!isActive);
          console.log('clicked');
        }}
      >
        <div className='w-full h-[2px] rounded-lg bg-black'></div>
        <div className='w-full h-[2px] rounded-lg bg-black'></div>
        <div className='w-full h-[2px] rounded-lg bg-black'></div>
      </div>
      <Header />
      <div className={`flex pt-[68px] ${isActive ? 'z-99' : ''} max-sm:pt-[58px] max-sm:pl-0 h-screen bg-[rgba(249,243,253,1)]`}>
        <div
          className={`min-w-80 w-80 px-3 pt-5 max-sm:absolute max-sm:h-full max-sm:left-0 max-sm:top-0 max-sm:bg-[rgba(249,243,253,1)] max-sm:z-99 h-full border-r border-gray-300 flex flex-col overflow-y-auto ${
            isActive ? 'z-100 max-sm:w-[80%] max-sm:left-[-0%] max-sm:h-[800px] max-sm:pt-20' : 'max-sm:left-[-120%]'
          }`}
        >
          <div
            onClick={() => navigate(`/my-courses`)}
            className='max-sm:hidden cursor-pointer h-10 w-10 mb-5 rotate-180 bg-gray-300 rounded-full flex items-center justify-center'
          >
            <ForwardArrowSVG size={13} />
          </div>
          <h1 className='font-bold text-lg mb-4 px-1'>Course Lessons</h1>
          <div className='flex flex-col gap-2'>
            {courseSections.map(section => (
              <DropDownComponents
                key={section.id}
                id={section.id}
                title={section.title}
                numberOfLessons={section.numberOfLessons}
                totalTime={section.totalTime}
                isNavStyle
                isUserOwned
                dropDownItems={section.dropDownItems}
                onLessonClick={idx => setActiveLesson({ sectionId: section.id, lessonIndex: idx, isQuiz: false })}
              />
            ))}
            {course.quiz_settings && quizItem && (
              <QuizDropDownComponents
                key='quiz'
                id='quiz'
                title='Course Quiz'
                numberOfLessons='1'
                totalTime={`${course.quiz_settings.duration}mins`}
                isNavStyle
                isUserOwned
                dropDownItems={[quizItem]}
                onLessonClick={() => setActiveLesson({ sectionId: 'quiz', lessonIndex: 0, isQuiz: true })}
              />
            )}
          </div>
        </div>
        <div className='flex-auto overflow-y-auto max-sm:p-0 max-sm:pt-4 p-6'>
          {activeLessonData ? (
            activeLessonData.type === 'video' ? (
              <CourseComponent
                title={activeLessonData.title}
                description={course.sections
                  .flatMap(s => s.lessons)
                  .find(l => l.title === activeLessonData.title)?.body || ''}
                videoUrl={course.sections
                  .flatMap(s => s.lessons)
                  .find(l => l.title === activeLessonData.title)?.video || ''}
                onComplete={() => handleLessonCompleted(activeLesson!.sectionId, activeLesson!.lessonIndex, false)}
                onPreviousLesson={goToPreviousLesson}
                onNextLesson={goToNextLesson}
              />
            ) : activeLessonData.type === 'document' ? (
              <DocumentComponent
                documentTitle={activeLessonData.title}
                documentDescription={
                  course.sections
                    .flatMap(s => s.lessons)
                    .find(l => l.title === activeLessonData.title)?.body || ''
                }
                documentUrl={
                  course.sections
                    .flatMap(s => s.lessons)
                    .find(l => l.title === activeLessonData.title)?.file_urls[0] || ''
                }
                onComplete={() => handleLessonCompleted(activeLesson!.sectionId, activeLesson!.lessonIndex, false)}
                onPreviousLesson={goToPreviousLesson}
                onNextLesson={goToNextLesson}
              />
            ) : (
              <QuizComponent
                quizTitle={activeLessonData.title}
                isLocked={checkQuizLocked()}
                passmark={course.quiz_settings!.passmark}
                duration={course.quiz_settings!.duration}
                courseId={course.id}
                onPreviousLesson={goToPreviousLesson}
                onNextLesson={goToNextLesson}
                onStartQuiz={() => {
                  handleLessonCompleted('quiz', 0, true);
                  navigate(`/quiz/${course.id}`);
                }}
              />
            )
          ) : (
            <div className='font-bold p-10 text-center'>Please select a lesson from the left panel.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartedCoursePage;