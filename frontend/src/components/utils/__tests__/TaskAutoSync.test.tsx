import { renderHook, act } from '@testing-library/react';
import { useTaskAutoSync } from '../TaskAutoSync';
import { syncTasksWithTwAndDb } from '../../HomeComponents/Tasks/Tasks';
import { AutoSyncProps } from '../types';

jest.mock('../../HomeComponents/Tasks/Tasks', () => ({
  syncTasksWithTwAndDb: jest.fn(),
}));

const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('useTaskAutoSync', () => {
  const mockSetIsLoading = jest.fn();
  const mockSyncTasksWithTwAndDb = syncTasksWithTwAndDb as jest.MockedFunction<
    typeof syncTasksWithTwAndDb
  >;

  const defaultProps: AutoSyncProps = {
    isLoading: false,
    setIsLoading: mockSetIsLoading,
    isAutoSyncEnabled: true,
    syncInterval: 1000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return handleSync function', () => {
    const { result } = renderHook(() => useTaskAutoSync(defaultProps));

    expect(result.current.handleSync).toBeDefined();
    expect(typeof result.current.handleSync).toBe('function');
  });

  it('should not start interval when auto-sync is disabled', () => {
    const props = { ...defaultProps, isAutoSyncEnabled: false };
    renderHook(() => useTaskAutoSync(props));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockSyncTasksWithTwAndDb).not.toHaveBeenCalled();
  });

  it('should start interval when auto-sync is enabled', () => {
    renderHook(() => useTaskAutoSync(defaultProps));

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Auto-sync: Triggering periodic sync...'
    );
    expect(mockSyncTasksWithTwAndDb).toHaveBeenCalledTimes(1);
  });

  it('should trigger sync at correct intervals', () => {
    renderHook(() => useTaskAutoSync(defaultProps));

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockSyncTasksWithTwAndDb).toHaveBeenCalledTimes(3);
  });

  it('should skip sync when already loading', async () => {
    const props = { ...defaultProps, isLoading: true };
    const { result } = renderHook(() => useTaskAutoSync(props));

    await act(async () => {
      await result.current.handleSync();
    });

    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Auto-sync: Sync already in progress, skipping.'
    );
    expect(mockSyncTasksWithTwAndDb).not.toHaveBeenCalled();
    expect(mockSetIsLoading).not.toHaveBeenCalled();
  });

  it('should handle successful sync', async () => {
    mockSyncTasksWithTwAndDb.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useTaskAutoSync(defaultProps));

    await act(async () => {
      await result.current.handleSync();
    });

    expect(mockSetIsLoading).toHaveBeenCalledWith(true);
    expect(mockSyncTasksWithTwAndDb).toHaveBeenCalledTimes(1);
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
  });

  it('should handle sync errors', async () => {
    const error = new Error('Sync failed');
    mockSyncTasksWithTwAndDb.mockRejectedValueOnce(error);
    const { result } = renderHook(() => useTaskAutoSync(defaultProps));

    await act(async () => {
      await result.current.handleSync();
    });

    expect(mockSetIsLoading).toHaveBeenCalledWith(true);
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Sync wrapper caught an error:',
      error
    );
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
  });

  it('should cleanup interval on unmount', () => {
    const { unmount } = renderHook(() => useTaskAutoSync(defaultProps));

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockSyncTasksWithTwAndDb).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockSyncTasksWithTwAndDb).toHaveBeenCalledTimes(1);
  });

  it('should restart interval when syncInterval changes', () => {
    const { rerender } = renderHook((props) => useTaskAutoSync(props), {
      initialProps: defaultProps,
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockSyncTasksWithTwAndDb).toHaveBeenCalledTimes(1);

    const newProps = { ...defaultProps, syncInterval: 500 };
    rerender(newProps);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(mockSyncTasksWithTwAndDb).toHaveBeenCalledTimes(2);
  });

  it('should restart interval when isAutoSyncEnabled changes', () => {
    const { rerender } = renderHook((props) => useTaskAutoSync(props), {
      initialProps: { ...defaultProps, isAutoSyncEnabled: false },
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockSyncTasksWithTwAndDb).not.toHaveBeenCalled();

    const newProps = { ...defaultProps, isAutoSyncEnabled: true };
    rerender(newProps);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockSyncTasksWithTwAndDb).toHaveBeenCalledTimes(1);
  });
});
