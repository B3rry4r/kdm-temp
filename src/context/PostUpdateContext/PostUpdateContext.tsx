// PostUpdateContext.tsx
import React, { createContext, useContext, useState } from 'react';

const PostUpdateContext = createContext<{
  shouldRefresh: boolean;
  triggerRefresh: () => void;
}>({
  shouldRefresh: false,
  triggerRefresh: () => {},
});

export const usePostUpdate = () => useContext(PostUpdateContext);

export const PostUpdateProvider = ({ children }: { children: React.ReactNode }) => {
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const triggerRefresh = () => {
    setShouldRefresh(true);
    setTimeout(() => setShouldRefresh(false), 100); // Reset after a short delay
  };

  return (
    <PostUpdateContext.Provider value={{ shouldRefresh, triggerRefresh }}>
      {children}
    </PostUpdateContext.Provider>
  );
};
