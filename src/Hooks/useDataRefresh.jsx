import { useState, useCallback } from 'react';

const useDataRefresh = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    refreshTrigger,
    triggerRefresh,
  };
};

export default useDataRefresh;
