import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosInstance } from 'axios';

// Interface for Corper data
export interface Corper {
  state_of_origin: string;
  state_code: string;
  sector: string;
  nin: string;
  callup_number: string | null;
  access_code?: string;
}

// Interface for User data
export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  profile_picture: string | null;
  country: string;
  gender: string;
  corper: Corper | null;
  referral_code: string;
  terms_of_service: number;
  bio: string | null;
  active_subscription: boolean;
  is_an_admin: boolean;
  is_consultant: boolean;
  is_consultant_profile: boolean;
  created_at: string;
}

// Interface for AuthContext
interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initiateRegistration: (email: string, phone: string) => Promise<void>;
  register: (data: {
    type: number;
    email: string;
    phone: string;
    token: string;
    firstname: string;
    lastname: string;
    country: string;
    gender: string;
    password: string;
    referral_code: string;
    state_of_origin?: string;
    state_code?: string;
    sector?: string;
    nin?: string;
    callup_number?: string | null;
    access_code?: string;
  }) => Promise<void>;
  resetToken: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  apiClient: AxiosInstance;
  apiClient2: AxiosInstance;
  apiClient3: AxiosInstance;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component to provide auth context to the app
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Create Axios instance for API requests
  const apiClient = axios.create({
    baseURL: 'https://staging.kudimata.com/api/v2',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Create Third Axios instance for API requests (new endpoint)
  const apiClient3 = axios.create({
    baseURL: 'https://staging.kudimata.com/api/v2/',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Create second Axios instance for API requests (new endpoint)
  const apiClient2 = axios.create({
    baseURL: 'https://staging.kudimata.com/api/v2/admin',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Add request interceptor for Authorization header (apiClient2)
  apiClient2.interceptors.request.use(
    (config) => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        config.headers['Authorization'] = `Bearer ${storedToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add request interceptor for Authorization header (apiClient3)
  apiClient3.interceptors.request.use(
    (config) => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        config.headers['Authorization'] = `Bearer ${storedToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add request interceptor for Authorization header
  apiClient.interceptors.request.use(
    (config) => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        config.headers['Authorization'] = `Bearer ${storedToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor for 401 handling
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.log('Unauthorized detected, logging out');
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
      }
      return Promise.reject(error);
    }
  );

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      console.log('Initializing auth from localStorage:', { storedToken, storedUser });
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setIsAuthLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { data, token } = response.data;

      setUser(data);
      setToken(token);
      setIsAuthenticated(true);

      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('token', token);

      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
    }
  };

  // Initiate registration function
  const initiateRegistration = async (email: string, phone: string) => {
    try {
      const payload = { email, phone };
      console.log('Initiate registration payload:', JSON.stringify(payload, null, 2));
      await apiClient.post('/auth/validate', payload);
    } catch (error: any) {
      console.error('Initiate registration error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to initiate registration');
    }
  };

  // Register function
  const register = async (data: {
    type: number;
    email: string;
    phone: string;
    token: string;
    firstname: string;
    lastname: string;
    country: string;
    gender: string;
    password: string;
    referral_code: string;
    state_of_origin?: string;
    state_code?: string;
    sector?: string;
    nin?: string;
    // callup_number?: string | null;
    access_code?: string;
    profile_picture?: string;
  }) => {
    try {
      console.log('Registration payload:', JSON.stringify(data, null, 2));
      const response = await apiClient.post('/auth/register', data);
      const { data: userData, token } = response.data;

      setUser(userData);
      setToken(token);
      setIsAuthenticated(true);

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);

      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  // Request reset token function
  const resetToken = async (email: string) => {
    try {
      await apiClient.post('/auth/reset/token', { email });
    } catch (error: any) {
      console.error('Reset token error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to send reset token');
    }
  };

  // Reset password function
  const resetPassword = async (token: string, password: string) => {
    try {
      await apiClient.post('/auth/reset', { token, password });
    } catch (error: any) {
      console.error('Reset password error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Context value
  const value = {
    isAuthenticated,
    isAuthLoading,
    user,
    token,
    login,
    logout,
    initiateRegistration,
    register,
    resetToken,
    resetPassword,
    apiClient,
    apiClient2,
    apiClient3,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};