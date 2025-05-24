import React, { createContext, useContext, useState } from 'react';

const PostUpdateContext = createContext<{
  refreshKey: number;
  triggerRefresh: () => void;
}>({
  refreshKey: 0,
  triggerRefresh: () => {},
});

export const usePostUpdate = () => useContext(PostUpdateContext);

export const PostUpdateProvider = ({ children }: { children: React.ReactNode }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1); // Increment to trigger refresh
  };

  return (
    <PostUpdateContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </PostUpdateContext.Provider>
  );
};