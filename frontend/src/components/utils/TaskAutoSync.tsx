import { useCallback, useEffect } from 'react';
import { syncTasksWithTwAndDb } from '../HomeComponents/Tasks/Tasks';
import { AutoSyncProps } from './types';

export const useTaskAutoSync = (props: AutoSyncProps) => {
  const { isLoading, setIsLoading, isAutoSyncEnabled, syncInterval } = props;
  const handleSync = useCallback(async () => {
    if (isLoading) {
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
