import React, { createContext, useContext, useState, ReactNode } from 'react';
import AlertMessage from '../../components/AlertMessage';

// Define the context type
interface AlertContextType {
  showAlert: (message: string, severity?: 'success' | 'error' | 'info' | 'warning' | 'purple') => void;
  hideAlert: () => void;
}

// Create context with default values
const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Provider component
export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error' | 'info' | 'warning' | 'purple'>('purple');

  const showAlert = (
    newMessage: string,
    newSeverity: 'success' | 'error' | 'info' | 'warning' | 'purple' = 'purple'
  ) => {
    setMessage(newMessage);
    setSeverity(newSeverity);
    setOpen(true);
  };

  const hideAlert = () => {
    setOpen(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <AlertMessage 
        open={open}
        message={message}
        severity={severity} 
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
};

// Custom hook to use the alert context
export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}; 