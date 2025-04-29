import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();

  console.log('PrivateRoute:', { isAuthenticated, isAuthLoading, pathname: location.pathname });

  if (isAuthLoading) {
    return (
      <div className="w-full flex items-center justify-center h-full">
        <div className="loader"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Redirecting to /login from:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default PrivateRoute;