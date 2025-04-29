import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../AuthContext/AuthContext';

interface Topic {
  id: number;
  name: string;
  logo?: string;
  banner: string;
  follower_count: number;
}

interface Institution {
  id: number;
  name: string;
  image?: string | null;
  description?: string | null;
  banner?: string | null;
  follower_count: number;
}

interface DataContextType {
  topics: Topic[];
  institutions: Institution[];
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, apiClient } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
            // Skip fetching if already fetched
            if (topics.length > 0 && institutions.length > 0) return;
            
      if (!isAuthenticated) {
        setTopics([]);
        setInstitutions([]);
        return;
      }

      setLoading(true);
      try {
        const topicRes = await apiClient.get('/topics');
        const institutionRes = await apiClient.get('/orgs');

        setTopics(topicRes.data);
        console.log(topicRes.data);
        setInstitutions(
          Array.isArray(institutionRes.data.data) ? institutionRes.data.data : []
        );
      } catch (err: any) {
        console.error('Data fetch error:', err.response?.data || err.message);
        setError(err.response?.status === 401 ? 'Please log in' : 'Failed to load topics or organizations');
        setTopics([]);
        setInstitutions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, apiClient]);

  return (
    <DataContext.Provider value={{ topics, institutions, loading, error }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};