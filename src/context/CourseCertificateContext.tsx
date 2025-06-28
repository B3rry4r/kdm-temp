import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CourseCertificateContextType {
  certificateCourseTitle: string | null;
  setCertificateCourseTitle: (title: string | null) => void;
}

const CourseCertificateContext = createContext<CourseCertificateContextType | undefined>(undefined);

export const CourseCertificateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [certificateCourseTitle, setCertificateCourseTitle] = useState<string | null>(null);

  return (
    <CourseCertificateContext.Provider value={{ certificateCourseTitle, setCertificateCourseTitle }}>
      {children}
    </CourseCertificateContext.Provider>
  );
};

export const useCourseCertificate = (): CourseCertificateContextType => {
  const context = useContext(CourseCertificateContext);
  if (!context) {
    throw new Error('useCourseCertificate must be used within a CourseCertificateProvider');
  }
  return context;
};
