import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../AuthContext/AuthContext';

// Types for tracking course progress
interface LessonProgress {
  lessonId: number;
  completed: boolean;
  timeSpent?: number; // Optional time tracking in seconds
}

interface SectionProgress {
  sectionId: number;
  completed: boolean;
  lessons: LessonProgress[];
}

interface CourseProgress {
  courseId: number;
  sections: SectionProgress[];
  lastAccessed?: number; // Timestamp
}

interface CourseProgressState {
  courses: CourseProgress[];
}

interface CourseProgressContextType {
  markLessonComplete: (courseId: number, sectionId: number, lessonId: number) => void;
  markSectionComplete: (courseId: number, sectionId: number) => void;
  getLessonStatus: (courseId: number, sectionId: number, lessonId: number) => boolean;
  getSectionStatus: (courseId: number, sectionId: number) => boolean;
  getSectionProgress: (courseId: number, sectionId: number) => number; // percentage
  getCourseProgress: (courseId: number) => number; // percentage
  trackedCourses: CourseProgress[];
  resetCourseProgress: (courseId: number) => void;
}

const CourseProgressContext = createContext<CourseProgressContextType | undefined>(undefined);

export const CourseProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [progressState, setProgressState] = useState<CourseProgressState>({ courses: [] });

  // Load progress from localStorage when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      const storageKey = `course_progress_${user.id}`;
      const savedProgress = localStorage.getItem(storageKey);
      
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          setProgressState(parsed);
          console.log('Loaded course progress from localStorage:', parsed);
        } catch (error) {
          console.error('Failed to parse course progress from localStorage:', error);
          setProgressState({ courses: [] });
        }
      } else {
        setProgressState({ courses: [] });
      }
    }
  }, [user?.id]);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (user?.id && progressState.courses.length > 0) {
      const storageKey = `course_progress_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(progressState));
      console.log('Saved course progress to localStorage:', progressState);
    }
  }, [progressState, user?.id]);

  // Find or create course progress
  const getOrCreateCourseProgress = (courseId: number): CourseProgress => {
    const existingCourse = progressState.courses.find(c => c.courseId === courseId);
    
    if (existingCourse) {
      return existingCourse;
    }
    
    // Create new course progress
    const newCourse: CourseProgress = {
      courseId,
      sections: [],
      lastAccessed: Date.now()
    };
    
    setProgressState(prev => ({
      courses: [...prev.courses, newCourse]
    }));
    
    return newCourse;
  };

  // Find or create section progress
  const getOrCreateSectionProgress = (courseId: number, sectionId: number): SectionProgress => {
    const course = getOrCreateCourseProgress(courseId);
    const existingSection = course.sections.find(s => s.sectionId === sectionId);
    
    if (existingSection) {
      return existingSection;
    }
    
    // Create new section progress
    const newSection: SectionProgress = {
      sectionId,
      completed: false,
      lessons: []
    };
    
    setProgressState(prev => ({
      courses: prev.courses.map(c => 
        c.courseId === courseId
          ? { ...c, sections: [...c.sections, newSection] }
          : c
      )
    }));
    
    return newSection;
  };

  // Mark a lesson as complete
  const markLessonComplete = (courseId: number, sectionId: number, lessonId: number) => {
    const section = getOrCreateSectionProgress(courseId, sectionId);
    const existingLesson = section.lessons.find(l => l.lessonId === lessonId);
    
    if (existingLesson && existingLesson.completed) {
      return; // Already completed
    }
    
    setProgressState(prev => ({
      courses: prev.courses.map(course => 
        course.courseId === courseId
          ? {
              ...course,
              lastAccessed: Date.now(),
              sections: course.sections.map(section => 
                section.sectionId === sectionId
                  ? {
                      ...section,
                      lessons: existingLesson
                        ? section.lessons.map(lesson => 
                            lesson.lessonId === lessonId
                              ? { ...lesson, completed: true }
                              : lesson
                          )
                        : [...section.lessons, { lessonId, completed: true }]
                    }
                  : section
              )
            }
          : course
      )
    }));
  };

  // Mark a section as complete (only in localStorage, no API call)
  const markSectionComplete = (courseId: number, sectionId: number) => {
    // Update local state only
    setProgressState(prev => ({
      courses: prev.courses.map(course => 
        course.courseId === courseId
          ? {
              ...course,
              lastAccessed: Date.now(),
              sections: course.sections.map(section => 
                section.sectionId === sectionId
                  ? { ...section, completed: true }
                  : section
              )
            }
          : course
      )
    }));
  };

  // Check if a lesson is completed
  const getLessonStatus = (courseId: number, sectionId: number, lessonId: number): boolean => {
    const course = progressState.courses.find(c => c.courseId === courseId);
    if (!course) return false;
    
    const section = course.sections.find(s => s.sectionId === sectionId);
    if (!section) return false;
    
    const lesson = section.lessons.find(l => l.lessonId === lessonId);
    return lesson ? lesson.completed : false;
  };

  // Check if a section is completed
  const getSectionStatus = (courseId: number, sectionId: number): boolean => {
    const course = progressState.courses.find(c => c.courseId === courseId);
    if (!course) return false;
    
    const section = course.sections.find(s => s.sectionId === sectionId);
    return section ? section.completed : false;
  };

  // Calculate section progress as a percentage
  const getSectionProgress = (courseId: number, sectionId: number): number => {
    const course = progressState.courses.find(c => c.courseId === courseId);
    if (!course) return 0;
    
    const section = course.sections.find(s => s.sectionId === sectionId);
    if (!section || section.lessons.length === 0) return 0;
    
    const completedLessons = section.lessons.filter(l => l.completed).length;
    return Math.round((completedLessons / section.lessons.length) * 100);
  };

  // Calculate course progress as a percentage
  const getCourseProgress = (courseId: number): number => {
    const course = progressState.courses.find(c => c.courseId === courseId);
    if (!course || course.sections.length === 0) return 0;
    
    const completedSections = course.sections.filter(s => s.completed).length;
    return Math.round((completedSections / course.sections.length) * 100);
  };

  // Reset course progress
  const resetCourseProgress = (courseId: number) => {
    setProgressState(prev => ({
      courses: prev.courses.filter(c => c.courseId !== courseId)
    }));
  };

  return (
    <CourseProgressContext.Provider
      value={{
        markLessonComplete,
        markSectionComplete,
        getLessonStatus,
        getSectionStatus,
        getSectionProgress,
        getCourseProgress,
        trackedCourses: progressState.courses,
        resetCourseProgress
      }}
    >
      {children}
    </CourseProgressContext.Provider>
  );
};

export const useCourseProgress = (): CourseProgressContextType => {
  const context = useContext(CourseProgressContext);
  if (context === undefined) {
    throw new Error('useCourseProgress must be used within a CourseProgressProvider');
  }
  return context;
}; 