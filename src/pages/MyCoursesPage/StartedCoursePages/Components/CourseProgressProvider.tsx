import React, { createContext, useContext, useState } from 'react';

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
  progress: ProgressData;
  markLessonComplete: (courseId: number, sectionId: number, lessonId: number) => void;
  markSectionComplete: (courseId: number, sectionId: number) => void;
  getLessonStatus: (courseId: number, sectionId: number, lessonId: number) => boolean;
  getSectionStatus: (courseId: number, sectionId: number) => boolean;
  getCourseProgress: (courseId: number) => number;
}

const CourseProgressContext = createContext<CourseProgressContextType | undefined>(undefined);

export const CourseProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<ProgressData>({});

  const markLessonComplete = (courseId: number, sectionId: number, lessonId: number) => {
    console.log('markLessonComplete:', { courseId, sectionId, lessonId });
    setProgress(prev => {
      const newProgress = { ...prev };
      if (!newProgress[courseId]) newProgress[courseId] = {};
      if (!newProgress[courseId].sections) newProgress[courseId].sections = {};
      if (!newProgress[courseId].sections![sectionId]) newProgress[courseId].sections![sectionId] = {};
      if (!newProgress[courseId].sections![sectionId].lessons) newProgress[courseId].sections![sectionId].lessons = {};
      newProgress[courseId].sections![sectionId].lessons![lessonId] = { isCompleted: true };
      return newProgress;
    });
  };

  const markSectionComplete = (courseId: number, sectionId: number) => {
    console.log('markSectionComplete:', { courseId, sectionId });
    setProgress(prev => {
      const newProgress = { ...prev };
      if (!newProgress[courseId]) newProgress[courseId] = {};
      if (!newProgress[courseId].sections) newProgress[courseId].sections = {};
      newProgress[courseId].sections![sectionId] = { ...(newProgress[courseId].sections![sectionId] || {}), isCompleted: true };
      return newProgress;
    });
  };

  const getLessonStatus = (courseId: number, sectionId: number, lessonId: number): boolean => {
    const isCompleted = progress[courseId]?.sections?.[sectionId]?.lessons?.[lessonId]?.isCompleted || false;
    console.log('getLessonStatus:', { courseId, sectionId, lessonId, isCompleted });
    return isCompleted;
  };

  const getSectionStatus = (courseId: number, sectionId: number): boolean => {
    const isCompleted = progress[courseId]?.sections?.[sectionId]?.isCompleted || false;
    console.log('getSectionStatus:', { courseId, sectionId, isCompleted });
    return isCompleted;
  };

  const getCourseProgress = (courseId: number): number => {
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
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    console.log('getCourseProgress:', { courseId, progressPercent });
    return progressPercent;
  };

  const contextValue: CourseProgressContextType = {
    progress,
    markLessonComplete,
    markSectionComplete,
    getLessonStatus,
    getSectionStatus,
    getCourseProgress,
  };

  return <CourseProgressContext.Provider value={contextValue}>{children}</CourseProgressContext.Provider>;
};

export const useCourseProgress = () => {
  const context = useContext(CourseProgressContext);
  if (context === undefined) {
    throw new Error('useCourseProgress must be used within a CourseProgressProvider');
  }
  return context;
};