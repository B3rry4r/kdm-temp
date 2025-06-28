import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CourseSummary {
  completion_percent: number;
  course_status: string;
}

interface CourseSummaryMap {
  [courseId: number]: CourseSummary;
}

interface CourseSummaryContextType {
  courseSummaries: CourseSummaryMap;
  setCourseSummaries: React.Dispatch<React.SetStateAction<CourseSummaryMap>>;
}

const CourseSummaryContext = createContext<CourseSummaryContextType | undefined>(undefined);

export const CourseSummaryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courseSummaries, setCourseSummaries] = useState<CourseSummaryMap>({});

  return (
    <CourseSummaryContext.Provider value={{ courseSummaries, setCourseSummaries }}>
      {children}
    </CourseSummaryContext.Provider>
  );
};

export const useCourseSummary = (): CourseSummaryContextType => {
  const context = useContext(CourseSummaryContext);
  if (!context) {
    throw new Error('useCourseSummary must be used within a CourseSummaryProvider');
  }
  return context;
};
