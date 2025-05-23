// CourseProgressProvider.tsx (or wherever your CourseProgressContext is defined)
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// Define your types for CourseProgress and your context state
interface ProgressData {
  [courseId: number]: {
    sections?: {
      [sectionId: number]: {
        isCompleted?: boolean;
        lessons?: {
          [lessonId: number]: {
            isCompleted?: boolean;
          };
        };
      };
    };
  };
}

interface CourseProgressContextType {
  progress: ProgressData; // Assuming you store this state
  markLessonComplete: (courseId: number, sectionId: number, lessonId: number) => void;
  markSectionComplete: (courseId: number, sectionId: number) => void;
  getLessonStatus: (courseId: number, sectionId: number, lessonId: number) => boolean;
  getSectionStatus: (courseId: number, sectionId: number) => boolean;
  getCourseProgress: (courseId: number) => number;
}

const CourseProgressContext = createContext<CourseProgressContextType | undefined>(undefined);

export const CourseProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<ProgressData>({}); // Example state for progress

  // *** IMPORTANT: Wrap these functions with useCallback ***

  const markLessonComplete = useCallback((courseId: number, sectionId: number, lessonId: number) => {
    setProgress(prevProgress => {
      const newProgress = { ...prevProgress };
      if (!newProgress[courseId]) newProgress[courseId] = {};
      if (!newProgress[courseId].sections) newProgress[courseId].sections = {};
      if (!newProgress[courseId].sections![sectionId]) newProgress[courseId].sections![sectionId] = {};
      if (!newProgress[courseId].sections![sectionId].lessons) newProgress[courseId].sections![sectionId].lessons = {};
      newProgress[courseId].sections![sectionId].lessons![lessonId] = { isCompleted: true };
      return newProgress;
    });
  }, []); // Dependencies for setters are often empty if they just update state

  const markSectionComplete = useCallback((courseId: number, sectionId: number) => {
    setProgress(prevProgress => {
      const newProgress = { ...prevProgress };
      if (!newProgress[courseId]) newProgress[courseId] = {};
      if (!newProgress[courseId].sections) newProgress[courseId].sections = {};
      newProgress[courseId].sections![sectionId] = { ...(newProgress[courseId].sections![sectionId] || {}), isCompleted: true };
      return newProgress;
    });
  }, []);

  const getLessonStatus = useCallback((courseId: number, sectionId: number, lessonId: number): boolean => {
    return progress[courseId]?.sections?.[sectionId]?.lessons?.[lessonId]?.isCompleted || false;
  }, [progress]); // Depends on the 'progress' state

  const getSectionStatus = useCallback((courseId: number, sectionId: number): boolean => {
    return progress[courseId]?.sections?.[sectionId]?.isCompleted || false;
  }, [progress]); // Depends on the 'progress' state

  const getCourseProgress = useCallback((courseId: number): number => {
    // Implement your actual progress calculation logic here
    // This is a placeholder for your actual logic
    const courseData = progress[courseId];
    if (!courseData || !courseData.sections) return 0;

    let totalLessons = 0;
    let completedLessons = 0;

    for (const sectionId in courseData.sections) {
      const section = courseData.sections[sectionId];
      if (section && section.lessons) {
        for (const lessonId in section.lessons) {
          totalLessons++;
          if (section.lessons[lessonId].isCompleted) {
            completedLessons++;
          }
        }
      }
    }
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  }, [progress]); // Depends on the 'progress' state

  const contextValue = useMemo(() => ({
    progress,
    markLessonComplete,
    markSectionComplete,
    getLessonStatus,
    getSectionStatus,
    getCourseProgress,
  }), [
    progress,
    markLessonComplete,
    markSectionComplete,
    getLessonStatus,
    getSectionStatus,
    getCourseProgress,
  ]);

  return (
    <CourseProgressContext.Provider value={contextValue}>
      {children}
    </CourseProgressContext.Provider>
  );
};

export const useCourseProgress = () => {
  const context = useContext(CourseProgressContext);
  if (context === undefined) {
    throw new Error('useCourseProgress must be used within a CourseProgressProvider');
  }
  return context;
};