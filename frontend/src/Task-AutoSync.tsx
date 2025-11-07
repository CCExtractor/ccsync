import { useCallback, useEffect } from 'react';
// We still don't need 'Props'
import { syncTasksWithTwAndDb } from './components/HomeComponents/Tasks/Tasks';
import { AutoSyncProps } from './components/utils/types';

export const useTaskAutoSync = (props: AutoSyncProps) => {
  const { isLoading, setIsLoading, isAutoSyncEnabled, syncInterval } = props;
  const handleSync = useCallback(async () => {
    if (isLoading) {
      console.log('Auto-sync: Sync already in progress, skipping.');
      return;
    }
    setIsLoading(true);
    try {
      await syncTasksWithTwAndDb();
    } catch (error) {
      console.error('Sync wrapper caught an error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, setIsLoading]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined = undefined;
    if (isAutoSyncEnabled) {
      intervalId = setInterval(() => {
        console.log('Auto-sync: Triggering periodic sync...');
        handleSync();
      }, syncInterval);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [handleSync, isAutoSyncEnabled, syncInterval]);
  return { handleSync };
};
