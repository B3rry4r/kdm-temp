import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../../components/header/Header';
import { ForwardArrowSVG } from '../../../assets/icons/icons';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import CourseComponent from './Components/CourseComponent';
import DropDownComponents from '../SingleCousre/DropDownComponents/DropDownComponents';
import QuizDropDownComponents from '../SingleCousre/DropDownComponents/QuizDropDownComponent';
import { useCourseProgress } from '../../../context/CourseProgressContext/CourseProgressContext';
import AlertMessage from '../../../components/AlertMessage';

const contentOuterClasses = 'w-full max-lg:pr-0 h-full pr-60 flex flex-col';
const contentHeaderClasses = 'w-full max-lg:px-4 max-lg:py-0 max-lg:pb-10 px-20 border-b border-gray-300 py-20';
const contentButtonContainerClasses = 'flex items-center justify-center p-4';

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
  passmark: number;
  duration: number;
  courseId: number;
  onPreviousLesson: () => void;
  onNextLesson: () => void;
  onStartQuiz: () => void;
}

const QuizComponent: React.FC<QuizProps> = ({ quizTitle, passmark, duration, courseId, onPreviousLesson, onNextLesson, onStartQuiz }) => {
  const { apiClient } = useAuth();
  const [quizScore, setQuizScore] = useState<QuizScore>({ course_id: courseId, score: 0, correct: 0, incorrect: 0 });
  const [loadingScore, setLoadingScore] = useState(true);

  useEffect(() => {
    const fetchQuizScore = async () => {
      try {
        setLoadingScore(true);
        const response = await apiClient.get<QuizScore>(`/course/quiz/score/${courseId}`);
        setQuizScore({
          course_id: response.data.course_id,
          score: response.data.score ?? 0,
          correct: response.data.correct ?? 0,
          incorrect: response.data.incorrect ?? 0,
        });
      } catch (err: any) {
        console.error('Error fetching quiz score:', err.response?.data || err.message);
        setQuizScore({ course_id: courseId, score: 0, correct: 0, incorrect: 0 });
      } finally {
        setLoadingScore(false);
      }
    };
    fetchQuizScore();
  }, [courseId, apiClient]);

  const durationInMinutes = Math.floor(duration / 60000);

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
          <div className='w-full p-18 max-lg:p-8 bg-white max-lg:bg-gray-200 flex-col flex rounded-2xl'>
            <div className='flex items-center justify-between'>
              <p className='text-3xl max-lg:text-xl font-bold'>{passmark}% or Higher</p>
              <p className='text-xs font-bold'>{loadingScore ? '-' : `${quizScore.score}%`}</p>
            </div>
            <div className='w-[1px] h-full hidden max-lg:flex rounded-lg bg-gray-300'></div>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-bold text-gray-600'>Grade to Pass</p>
              <p className='text-xs font-bold text-gray-600'>Your Grade</p>
            </div>
            <div className='flex items-center justify-between mt-2'>
              <p className='text-xs font-bold text-gray-600'>Duration: {durationInMinutes} mins</p>
              <p className='text-xs font-bold text-gray-600'>
                Correct: {quizScore.correct} | Incorrect: {quizScore.incorrect}
              </p>
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
  const [course, setCourse] = useState<Course | null>(null);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<ActiveLessonState | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'purple' | 'success' | 'error'>('purple');
  const [isActive, setIsActive] = useState(false);

  const { markLessonComplete, markSectionComplete, getLessonStatus, getSectionStatus } = useCourseProgress();
  const courseId = id ? parseInt(id) : 0;

  const markSectionCompleteAPI = async (sectionId: number) => {
    try {
      await apiClient.post(`/course/section/complete/${sectionId}`);
      markSectionComplete(courseId, sectionId); // Update context after API call
    } catch (err: any) {
      console.error(`Error marking section ${sectionId} complete:`, err.response?.data || err.message);
      setAlertMsg('Failed to save section progress.');
      setAlertSeverity('error');
      setAlertOpen(true);
      throw err; // Important: prevent navigation if API fails
    }
  };

  const estimateLessonTime = (lesson: Lesson): string => {
    if (lesson.type === 1) return '15mins';
    if (lesson.video !== '-') return '30mins';
    return '20mins';
  };

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

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) {
        setError('Invalid course ID');
        setIsLoading(false);
        return;
      }
      try {
        const response = await apiClient.get<Course>(`/course/${id}`);
        setCourse(response.data);
      } catch (err: any) {
        setError('Failed to load course');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [id, apiClient]);

  useEffect(() => {
    if (!course) return;

    const sections = course.sections.map(section => ({
      id: `section-${section.id}`,
      title: section.title,
      numberOfLessons: section.lessons.length.toString(),
      totalTime: calculateTotalTime(section.lessons),
      dropDownItems: section.lessons.map(lesson => ({
        title: lesson.title,
        time: estimateLessonTime(lesson),
        type: (lesson.type === 1 ? 'document' : 'video') as 'document' | 'video',
        isCompleted: getLessonStatus(courseId, section.id, lesson.id),
      })),
    }));
    setCourseSections(sections);

    // Logic to set the initial active lesson, guarded to run only once.
    if (activeLesson) return;

    let foundActive = false;
    for (const section of course.sections) {
      if (!getSectionStatus(courseId, section.id)) {
        for (let i = 0; i < section.lessons.length; i++) {
          if (!getLessonStatus(courseId, section.id, section.lessons[i].id)) {
            setActiveLesson({ sectionId: `section-${section.id}`, lessonIndex: i, isQuiz: false });
            foundActive = true;
            break;
          }
        }
        if (foundActive) break;
      }
    }

    if (!foundActive) {
      if (course.quiz_settings && !getSectionStatus(courseId, course.id)) {
        setActiveLesson({ sectionId: 'quiz', lessonIndex: 0, isQuiz: true });
      } else {
        if (course.sections.length > 0 && course.sections[0].lessons.length > 0) {
          setActiveLesson({ sectionId: `section-${course.sections[0].id}`, lessonIndex: 0, isQuiz: false });
        }
      }
    }
  }, [course, courseId, getLessonStatus, getSectionStatus, activeLesson]);

  const quizItem: QuizItem | null = course?.quiz_settings
    ? {
        title: 'Course Quiz',
        time: `${Math.floor(course.quiz_settings.duration / 60000)}mins`,
        type: 'quiz',
        isCompleted: getSectionStatus(courseId, course.id),
      }
    : null;

  const handleCompleteAndContinue = async () => {
    if (!activeLesson || !course) return;

    const { sectionId, lessonIndex } = activeLesson;
    const currentSection = course.sections.find(s => `section-${s.id}` === sectionId);
    if (!currentSection) return;

    const currentLesson = currentSection.lessons[lessonIndex];
    markLessonComplete(courseId, currentSection.id, currentLesson.id);

    const isLastLesson = lessonIndex === currentSection.lessons.length - 1;

    try {
      if (isLastLesson) {
        await markSectionCompleteAPI(currentSection.id);
      }

      // --- Navigation Logic ---
      if (!isLastLesson) {
        setActiveLesson({ ...activeLesson, lessonIndex: lessonIndex + 1 });
        return;
      }

      const currentSectionIndex = course.sections.findIndex(s => s.id === currentSection.id);
      const nextSection = course.sections[currentSectionIndex + 1];

      if (nextSection) {
        setActiveLesson({ sectionId: `section-${nextSection.id}`, lessonIndex: 0, isQuiz: false });
      } else if (course.quiz_settings) {
        setActiveLesson({ sectionId: 'quiz', lessonIndex: 0, isQuiz: true });
      } else {
        // await markCourseCompleteAPI();
      }
    } catch (error) {
      // Errors from markSectionCompleteAPI are caught here, preventing navigation.
      console.error('Could not proceed.', error);
    }
  };

  const handleStartQuiz = () => {
    if (!course) return;
    navigate(`/quiz/${course.id}`);
  };

  const goToNextLesson = () => {
    if (!activeLesson || !course) return;
    const { sectionId, lessonIndex, isQuiz } = activeLesson;
    if (isQuiz) return;

    const currentSection = course.sections.find(s => `section-${s.id}` === sectionId);
    if (!currentSection) return;

    const isLastLesson = lessonIndex === currentSection.lessons.length - 1;
    if (!isLastLesson) {
      setActiveLesson({ ...activeLesson, lessonIndex: lessonIndex + 1 });
      return;
    }

    const currentSectionIndex = course.sections.findIndex(s => s.id === currentSection.id);
    const nextSection = course.sections[currentSectionIndex + 1];
    if (nextSection) {
      setActiveLesson({ sectionId: `section-${nextSection.id}`, lessonIndex: 0, isQuiz: false });
    } else if (course.quiz_settings) {
      setActiveLesson({ sectionId: 'quiz', lessonIndex: 0, isQuiz: true });
    }
  };

  const goToPreviousLesson = () => {
    if (!activeLesson || !course) return;
    const { sectionId, lessonIndex, isQuiz } = activeLesson;

    if (isQuiz) {
      const lastSection = course.sections[course.sections.length - 1];
      setActiveLesson({ sectionId: `section-${lastSection.id}`, lessonIndex: lastSection.lessons.length - 1, isQuiz: false });
      return;
    }

    if (lessonIndex > 0) {
      setActiveLesson({ ...activeLesson, lessonIndex: lessonIndex - 1 });
      return;
    }

    const currentSectionIndex = course.sections.findIndex(s => `section-${s.id}` === sectionId);
    if (currentSectionIndex > 0) {
      const prevSection = course.sections[currentSectionIndex - 1];
      setActiveLesson({ sectionId: `section-${prevSection.id}`, lessonIndex: prevSection.lessons.length - 1, isQuiz: false });
    }
  };

  const activeLessonData = activeLesson
    ? activeLesson.isQuiz && course?.quiz_settings
      ? quizItem
      : courseSections.find(s => s.id === activeLesson.sectionId)?.dropDownItems[activeLesson.lessonIndex]
    : null;

  if (isLoading) {
    return (
      <div className='w-full flex items-center justify-center h-screen'>
        <div className='loader'></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className='w-full flex items-center justify-center h-screen'>
        <p className='text-[#68049B] text-xs'>{error || 'Course not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div
        className='w-11 h-11 items-center justify-center rounded-full hidden max-lg:flex fixed p-3 top-1 left-2 z-999 flex-col gap-1'
        onClick={() => setIsActive(!isActive)}
      >
        <div className='w-full h-[2px] rounded-lg bg-black'></div>
        <div className='w-full h-[2px] rounded-lg bg-black'></div>
        <div className='w-full h-[2px] rounded-lg bg-black'></div>
      </div>
      <Header />
      <div className={`flex pt-[68px] ${isActive ? 'z-99' : ''} max-lg:pt-[58px] max-lg:pl-0 h-screen bg-[rgba(249,243,253,1)]`}>
        <div
          className={`min-w-80 w-80 px-3 pt-5 max-lg:absolute max-lg:h-full max-lg:left-0 max-lg:top-0 max-lg:bg-[rgba(249,243,253,1)] max-lg:z-99 h-full border-r border-gray-300 flex flex-col overflow-y-auto ${
            isActive ? 'z-100 max-lg:w-[80%] max-lg:left-[-0%] max-lg:h-[800px] max-lg:pt-20' : 'max-lg:left-[-120%]'
          }`}
        >
          <div
            onClick={() => navigate(`/my-courses`)}
            className='max-lg:hidden cursor-pointer h-10 w-10 mb-5 rotate-180 bg-gray-300 rounded-full flex items-center justify-center'
          >
            <ForwardArrowSVG size={13} />
          </div>
          <h1 className='font-bold text-lg mb-4 px-1'>Course Lessons</h1>
          <div className='flex flex-col gap-2'>
            {courseSections.map((section, index) => (
              <DropDownComponents
                key={index}
                id={section.id}
                title={section.title}
                numberOfLessons={section.numberOfLessons}
                totalTime={section.totalTime}
                isNavStyle
                isUserOwned
                dropDownItems={section.dropDownItems}
              />
            ))}
            {course.quiz_settings && quizItem && (
              <QuizDropDownComponents
                key='quiz'
                id='quiz'
                title='Course Quiz'
                numberOfLessons='1'
                totalTime={quizItem.time}
                isNavStyle
                isUserOwned
                dropDownItems={[quizItem]}
                onLessonClick={() => setActiveLesson({ sectionId: 'quiz', lessonIndex: 0, isQuiz: true })}
              />
            )}
          </div>
        </div>
        <div className='flex-auto overflow-y-auto max-lg:p-0 max-lg:pt-4 p-6'>
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
                onComplete={handleCompleteAndContinue}
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
                onComplete={handleCompleteAndContinue}
                onPreviousLesson={goToPreviousLesson}
                onNextLesson={goToNextLesson}
              />
            ) : (
              <QuizComponent
                quizTitle={activeLessonData.title}
                passmark={course.quiz_settings!.passmark}
                duration={course.quiz_settings!.duration}
                courseId={course.id}
                onPreviousLesson={goToPreviousLesson}
                onNextLesson={goToNextLesson}
                onStartQuiz={handleStartQuiz}
              />
            )
          ) : (
            <div className='font-bold p-10 text-center'>Please select a lesson from the left panel.</div>
          )}
        </div>
      </div>
      <AlertMessage
        open={alertOpen}
        message={alertMsg}
        severity={alertSeverity}
        onClose={() => setAlertOpen(false)}
      />
    </div>
  );
};

export default StartedCoursePage;