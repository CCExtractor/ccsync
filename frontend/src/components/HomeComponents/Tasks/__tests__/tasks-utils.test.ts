import { toast } from 'react-toastify';
import {
  getDisplayedPages,
  handleCopy,
  handleDate,
  sortTasks,
  sortTasksById,
  markTaskAsCompleted,
  bulkMarkTasksAsCompleted,
  markTaskAsDeleted,
  bulkMarkTasksAsDeleted,
  getTimeSinceLastSync,
  hashKey,
  parseTaskwarriorDate,
  isOverdue,
  getPinnedTasks,
  savePinnedTasks,
  togglePinnedTask,
  isTaskPinned,
  calculateProjectStats,
  calculateTagStats,
} from '../tasks-utils';
import { Task } from '@/components/utils/types';

// Helper to create minimal task objects
const createTask = (
  id: number,
  status: string,
  description: string,
  project: string,
  tags: string[]
): Task => ({
  id,
  status,
  description,
  project,
  tags,
  uuid: '',
  urgency: 0,
  priority: '',
  due: '',
  end: '',
  entry: '',
  modified: '',
  email: '',
  start: '',
  wait: '',
  depends: [],
  rtype: '',
  recur: '',
  annotations: [],
});

describe('sortTasks', () => {
  const tasks: Task[] = [
    createTask(1, 'pending', '1', '1', ['1']),
    createTask(2, 'completed', '2', '2', ['2']),
    createTask(3, 'in-progress', '3', '3', ['3']),
  ];

  it('sorts tasks in ascending order by status', () => {
    const sortedTasks = sortTasks(tasks, 'asc');
    expect(sortedTasks).toEqual([
      createTask(2, 'completed', '2', '2', ['2']),
      createTask(3, 'in-progress', '3', '3', ['3']),
      createTask(1, 'pending', '1', '1', ['1']),
    ]);
  });

  it('sorts tasks in descending order by status', () => {
    const sortedTasks = sortTasks(tasks, 'desc');
    expect(sortedTasks).toEqual([
      createTask(1, 'pending', '1', '1', ['1']),
      createTask(3, 'in-progress', '3', '3', ['3']),
      createTask(2, 'completed', '2', '2', ['2']),
    ]);
  });
});

describe('sortTasksById', () => {
  const tasks: Task[] = [
    createTask(2, 'completed', '2', '2', ['2']),
    createTask(3, 'in-progress', '3', '3', ['3']),
    createTask(1, 'pending', '1', '1', ['1']),
  ];

  it('sorts tasks in ascending order by id', () => {
    const sortedTasks = sortTasksById(tasks, 'asc');
    expect(sortedTasks).toEqual([
      createTask(1, 'pending', '1', '1', ['1']),
      createTask(2, 'completed', '2', '2', ['2']),
      createTask(3, 'in-progress', '3', '3', ['3']),
    ]);
  });

  it('sorts tasks in descending order by id', () => {
    const sortedTasks = sortTasksById(tasks, 'desc');
    expect(sortedTasks).toEqual([
      createTask(3, 'in-progress', '3', '3', ['3']),
      createTask(2, 'completed', '2', '2', ['2']),
      createTask(1, 'pending', '1', '1', ['1']),
    ]);
  });
});

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('handleCopy', () => {
  it('shows success toast with correct message', () => {
    const text = 'Sample text';
    handleCopy(text);
    expect(toast.success).toHaveBeenCalledWith(`${text} copied to clipboard!`, {
      position: 'bottom-left',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  });
});

describe('getDisplayedPages', () => {
  it('returns all pages if totalPages is less than or equal to 3', () => {
    expect(getDisplayedPages(1, 1)).toEqual([1]);
    expect(getDisplayedPages(2, 1)).toEqual([1, 2]);
    expect(getDisplayedPages(2, 2)).toEqual([1, 2]);
    expect(getDisplayedPages(3, 1)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(3, 2)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(3, 3)).toEqual([1, 2, 3]);
  });

  it('returns first three pages if currentPage is 1', () => {
    expect(getDisplayedPages(4, 1)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(5, 1)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(6, 1)).toEqual([1, 2, 3]);
  });

  it('returns last three pages if currentPage is the last page', () => {
    expect(getDisplayedPages(4, 4)).toEqual([2, 3, 4]);
    expect(getDisplayedPages(5, 5)).toEqual([3, 4, 5]);
    expect(getDisplayedPages(6, 6)).toEqual([4, 5, 6]);
  });

  it('returns three consecutive pages centered around the currentPage if it is in the middle', () => {
    expect(getDisplayedPages(5, 2)).toEqual([1, 2, 3]);
    expect(getDisplayedPages(5, 3)).toEqual([2, 3, 4]);
    expect(getDisplayedPages(5, 4)).toEqual([3, 4, 5]);
    expect(getDisplayedPages(6, 3)).toEqual([2, 3, 4]);
    expect(getDisplayedPages(6, 4)).toEqual([3, 4, 5]);
  });
});

describe('handleDate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for valid date format YYYY-MM-DD', () => {
    const validDate = '2023-06-21';
    const result = handleDate(validDate);
    expect(result).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should return false and show error toast for invalid date format', () => {
    const invalidDate = '06/21/2023';
    const result = handleDate(invalidDate);
    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      'Invalid Date Format. Please use the YYYY-MM-DD format.',
      {
        position: 'bottom-left',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      }
    );
  });

  it('should return false and show toast for empty date string', () => {
    const emptyDate = '';
    const result = handleDate(emptyDate);
    expect(result).toBe(false);
  });

  it('should return false and show error toast for date with invalid characters', () => {
    const invalidDate = '2023-06-21a';
    const result = handleDate(invalidDate);
    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      'Invalid Date Format. Please use the YYYY-MM-DD format.',
      {
        position: 'bottom-left',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      }
    );
  });
});

import { url } from '@/components/utils/URLs';
// Mock fetch and toast
global.fetch = jest.fn();
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('markTaskAsCompleted', () => {
  const email = 'test@example.com';
  const encryptionSecret = 'secret';
  const UUID = 'user-uuid';
  const taskuuid = 'task-uuid';
  const backendURL = `${url.backendURL}complete-task`;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('marks task as completed successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    await markTaskAsCompleted(email, encryptionSecret, UUID, taskuuid);

    expect(fetch).toHaveBeenCalledWith(backendURL, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        email: email,
        encryptionSecret: encryptionSecret,
        UUID: UUID,
        taskuuid: taskuuid,
      }),
    });
  });
});

describe('markTaskAsDeleted', () => {
  const email = 'test@example.com';
  const encryptionSecret = 'secret';
  const UUID = 'user-uuid';
  const taskuuid = 'task-uuid';
  const backendURL = `${url.backendURL}delete-task`;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('marks task as deleted successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    await markTaskAsDeleted(email, encryptionSecret, UUID, taskuuid);

    expect(fetch).toHaveBeenCalledWith(backendURL, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        email: email,
        encryptionSecret: encryptionSecret,
        UUID: UUID,
        taskuuid: taskuuid,
      }),
    });
  });
});

describe('getTimeSinceLastSync', () => {
  let originalDateNow: () => number;

  beforeAll(() => {
    originalDateNow = Date.now;
  });

  afterAll(() => {
    Date.now = originalDateNow;
  });

  it('returns "Never synced" when lastSyncTimestamp is null', () => {
    expect(getTimeSinceLastSync(null)).toBe('Never synced');
  });

  it('returns correct message for seconds ago', () => {
    const now = 1000000000000;
    Date.now = jest.fn(() => now);
    const lastSync = now - 30000; // 30 seconds ago
    expect(getTimeSinceLastSync(lastSync)).toBe('Last updated 30 seconds ago');
  });

  it('returns correct message for 1 second ago', () => {
    const now = 1000000000000;
    Date.now = jest.fn(() => now);
    const lastSync = now - 1000; // 1 second ago
    expect(getTimeSinceLastSync(lastSync)).toBe('Last updated 1 second ago');
  });

  it('returns correct message for minutes ago', () => {
    const now = 1000000000000;
    Date.now = jest.fn(() => now);
    const lastSync = now - 5 * 60 * 1000; // 5 minutes ago
    expect(getTimeSinceLastSync(lastSync)).toBe('Last updated 5 minutes ago');
  });

  it('returns correct message for 1 minute ago', () => {
    const now = 1000000000000;
    Date.now = jest.fn(() => now);
    const lastSync = now - 60 * 1000; // 1 minute ago
    expect(getTimeSinceLastSync(lastSync)).toBe('Last updated 1 minute ago');
  });

  it('returns correct message for hours ago', () => {
    const now = 1000000000000;
    Date.now = jest.fn(() => now);
    const lastSync = now - 3 * 60 * 60 * 1000; // 3 hours ago
    expect(getTimeSinceLastSync(lastSync)).toBe('Last updated 3 hours ago');
  });

  it('returns correct message for 1 hour ago', () => {
    const now = 1000000000000;
    Date.now = jest.fn(() => now);
    const lastSync = now - 60 * 60 * 1000; // 1 hour ago
    expect(getTimeSinceLastSync(lastSync)).toBe('Last updated 1 hour ago');
  });

  it('returns correct message for days ago', () => {
    const now = 1000000000000;
    Date.now = jest.fn(() => now);
    const lastSync = now - 2 * 24 * 60 * 60 * 1000; // 2 days ago
    expect(getTimeSinceLastSync(lastSync)).toBe('Last updated 2 days ago');
  });

  it('returns correct message for 1 day ago', () => {
    const now = 1000000000000;
    Date.now = jest.fn(() => now);
    const lastSync = now - 24 * 60 * 60 * 1000; // 1 day ago
    expect(getTimeSinceLastSync(lastSync)).toBe('Last updated 1 day ago');
  });
});

describe('hashKey', () => {
  it('generates a consistent hash for the same key and email', () => {
    const key = 'lastSyncTime';
    const email = 'test@example.com';
    const hash1 = hashKey(key, email);
    const hash2 = hashKey(key, email);
    expect(hash1).toBe(hash2);
  });

  it('generates different hashes for different emails', () => {
    const key = 'lastSyncTime';
    const email1 = 'test1@example.com';
    const email2 = 'test2@example.com';
    const hash1 = hashKey(key, email1);
    const hash2 = hashKey(key, email2);
    expect(hash1).not.toBe(hash2);
  });

  it('generates different hashes for different keys', () => {
    const key1 = 'lastSyncTime';
    const key2 = 'otherKey';
    const email = 'test@example.com';
    const hash1 = hashKey(key1, email);
    const hash2 = hashKey(key2, email);
    expect(hash1).not.toBe(hash2);
  });

  it('returns a string', () => {
    const hash = hashKey('lastSyncTime', 'test@example.com');
    expect(typeof hash).toBe('string');
  });

  it('does not contain the original email', () => {
    const email = 'test@example.com';
    const hash = hashKey('lastSyncTime', email);
    expect(hash).not.toContain(email);
    expect(hash).not.toContain('test');
    expect(hash).not.toContain('@');
  });
});

describe('bulkMarkTasksAsCompleted', () => {
  const email = 'test@example.com';
  const encryptionSecret = 'secret';
  const UUID = 'user-uuid';
  const taskUUIDs = ['id1', 'id2'];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls API correctly and returns true on success', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    const result = await bulkMarkTasksAsCompleted(
      email,
      encryptionSecret,
      UUID,
      taskUUIDs
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('complete-tasks'),
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          encryptionSecret,
          UUID,
          taskuuids: taskUUIDs,
        }),
      }
    );

    expect(toast.success).toHaveBeenCalledWith('2 tasks marked as completed.');
    expect(result).toBe(true);
  });

  it('returns false and shows error toast when API responds with non-ok', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    const result = await bulkMarkTasksAsCompleted(
      email,
      encryptionSecret,
      UUID,
      taskUUIDs
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Bulk completion failed!');
    expect(result).toBe(false);
  });

  it('returns false and shows error toast when fetch throws a network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

    const result = await bulkMarkTasksAsCompleted(
      email,
      encryptionSecret,
      UUID,
      taskUUIDs
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Bulk complete failed');
    expect(result).toBe(false);
  });
});

describe('bulkMarkTasksAsDeleted', () => {
  const email = 'test@example.com';
  const encryptionSecret = 'secret';
  const UUID = 'user-uuid';
  const taskUUIDs = ['t1', 't2'];
  const backendURL = `${url.backendURL}delete-tasks`;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls API correctly and returns true on success', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    const result = await bulkMarkTasksAsDeleted(
      email,
      encryptionSecret,
      UUID,
      taskUUIDs
    );

    expect(fetch).toHaveBeenCalledWith(backendURL, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        encryptionSecret,
        UUID,
        taskuuids: taskUUIDs,
      }),
    });

    expect(toast.success).toHaveBeenCalledWith('2 tasks deleted.');
    expect(result).toBe(true);
  });

  it('returns false and shows error toast when API responds with non-ok', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    const result = await bulkMarkTasksAsDeleted(
      email,
      encryptionSecret,
      UUID,
      taskUUIDs
    );

    expect(toast.error).toHaveBeenCalledWith('Bulk deletion failed!');
    expect(result).toBe(false);
  });

  it('returns false and shows error toast when fetch throws a network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

    const result = await bulkMarkTasksAsDeleted(
      email,
      encryptionSecret,
      UUID,
      taskUUIDs
    );

    expect(toast.error).toHaveBeenCalledWith('Bulk delete failed');
    expect(result).toBe(false);
  });

  it('sends correct request body format with all required fields', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    await bulkMarkTasksAsCompleted('user@test.com', 'secret123', 'uuid-456', [
      'task-1',
      'task-2',
      'task-3',
    ]);

    const callArgs = (fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(callArgs[1].body);

    expect(requestBody).toEqual({
      email: 'user@test.com',
      encryptionSecret: 'secret123',
      UUID: 'uuid-456',
      taskuuids: ['task-1', 'task-2', 'task-3'],
    });
  });

  it('handles bulk complete with single task correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    const result = await bulkMarkTasksAsCompleted(
      'test@example.com',
      'secret',
      'uuid',
      ['single-task-uuid']
    );

    expect(toast.success).toHaveBeenCalledWith('1 task marked as completed.');
    expect(result).toBe(true);
  });

  it('includes Content-Type header in bulk complete request', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    await bulkMarkTasksAsCompleted('test@example.com', 'secret', 'uuid', [
      'task-1',
    ]);

    const headers = (fetch as jest.Mock).mock.calls[0][1].headers;

    expect(headers['Content-Type']).toBe('application/json');
  });

  it('returns false when bulk delete fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    const result = await bulkMarkTasksAsDeleted(
      'test@example.com',
      'secret',
      'uuid',
      ['task-1']
    );

    expect(result).toBe(false);
  });
});

describe('parseTaskwarriorDate', () => {
  it('parses Taskwarrior date format correctly', () => {
    const result = parseTaskwarriorDate('20241215T130002Z');
    expect(result).toEqual(new Date('2024-12-15T13:00:02Z'));
  });

  it('returns null for empty string', () => {
    expect(parseTaskwarriorDate('')).toBeNull();
  });

  it('returns null for invalid date format', () => {
    expect(parseTaskwarriorDate('invalid-date')).toBeNull();
  });

  it('handles ISO format gracefully', () => {
    const result = parseTaskwarriorDate('20241215T130002Z');
    expect(result).toBeInstanceOf(Date);
  });
});

describe('isOverdue', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-11-11T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns false for undefined due date', () => {
    expect(isOverdue(undefined)).toBe(false);
  });

  it('returns false for empty string due date', () => {
    expect(isOverdue('')).toBe(false);
  });

  it('returns false for future due date', () => {
    expect(isOverdue('20251215T130002Z')).toBe(false);
  });

  it('returns true for past due date', () => {
    expect(isOverdue('20251015T130002Z')).toBe(true);
  });

  it('returns false for today due date', () => {
    expect(isOverdue('20251111T130002Z')).toBe(false);
  });

  it('returns false for invalid date format', () => {
    expect(isOverdue('invalid-date')).toBe(false);
  });
});

describe('calculateProjectStats', () => {
  it('calculates stats for single project with all completed tasks', () => {
    const tasks: Task[] = [
      createTask(1, 'completed', 'Task 1', 'ProjectA', []),
      createTask(2, 'completed', 'Task 2', 'ProjectA', []),
      createTask(3, 'completed', 'Task 3', 'ProjectA', []),
    ];

    const stats = calculateProjectStats(tasks);

    expect(stats['ProjectA']).toEqual({
      completed: 3,
      total: 3,
      percentage: 100,
    });
  });

  it('calculates stats for single project with mixed completion', () => {
    const tasks: Task[] = [
      createTask(1, 'completed', 'Task 1', 'ProjectA', []),
      createTask(2, 'pending', 'Task 2', 'ProjectA', []),
      createTask(3, 'completed', 'Task 3', 'ProjectA', []),
      createTask(4, 'pending', 'Task 4', 'ProjectA', []),
    ];

    const stats = calculateProjectStats(tasks);

    expect(stats['ProjectA']).toEqual({
      completed: 2,
      total: 4,
      percentage: 50,
    });
  });

  it('calculates stats for multiple projects independently', () => {
    const tasks: Task[] = [
      createTask(1, 'completed', 'Task 1', 'ProjectA', []),
      createTask(2, 'pending', 'Task 2', 'ProjectA', []),
      createTask(3, 'completed', 'Task 3', 'ProjectB', []),
      createTask(4, 'completed', 'Task 4', 'ProjectB', []),
      createTask(5, 'completed', 'Task 5', 'ProjectB', []),
    ];

    const stats = calculateProjectStats(tasks);

    expect(stats['ProjectA']).toEqual({
      completed: 1,
      total: 2,
      percentage: 50,
    });

    expect(stats['ProjectB']).toEqual({
      completed: 3,
      total: 3,
      percentage: 100,
    });
  });

  it('ignores tasks with empty project names', () => {
    const tasks: Task[] = [
      createTask(1, 'completed', 'Task 1', '', []),
      createTask(2, 'completed', 'Task 2', 'ProjectA', []),
    ];

    const stats = calculateProjectStats(tasks);

    expect(stats['']).toBeUndefined();
    expect(stats['ProjectA']).toEqual({
      completed: 1,
      total: 1,
      percentage: 100,
    });
  });

  it('returns empty object for empty task list', () => {
    const stats = calculateProjectStats([]);
    expect(stats).toEqual({});
  });

  it('handles project with zero completed tasks', () => {
    const tasks: Task[] = [
      createTask(1, 'pending', 'Task 1', 'ProjectA', []),
      createTask(2, 'pending', 'Task 2', 'ProjectA', []),
    ];

    const stats = calculateProjectStats(tasks);

    expect(stats['ProjectA']).toEqual({
      completed: 0,
      total: 2,
      percentage: 0,
    });
  });

  it('rounds percentage correctly', () => {
    const tasks: Task[] = [
      createTask(1, 'completed', 'Task 1', 'ProjectA', []),
      createTask(2, 'pending', 'Task 2', 'ProjectA', []),
      createTask(3, 'pending', 'Task 3', 'ProjectA', []),
    ];

    const stats = calculateProjectStats(tasks);

    expect(stats['ProjectA'].percentage).toBe(33);
  });
});

describe('calculateTagStats', () => {
  it('calculates stats for single tag with all completed tasks', () => {
    const tasks: Task[] = [
      createTask(1, 'completed', 'Task 1', 'Project', ['urgent']),
      createTask(2, 'completed', 'Task 2', 'Project', ['urgent']),
      createTask(3, 'completed', 'Task 3', 'Project', ['urgent']),
    ];

    const stats = calculateTagStats(tasks);

    expect(stats['urgent']).toEqual({
      completed: 3,
      total: 3,
      percentage: 100,
    });
  });

  it('calculates stats for single tag with mixed completion', () => {
    const tasks: Task[] = [
      createTask(1, 'completed', 'Task 1', 'Project', ['urgent']),
      createTask(2, 'pending', 'Task 2', 'Project', ['urgent']),
      createTask(3, 'completed', 'Task 3', 'Project', ['urgent']),
      createTask(4, 'pending', 'Task 4', 'Project', ['urgent']),
      createTask(5, 'pending', 'Task 5', 'Project', ['urgent']),
    ];

    const stats = calculateTagStats(tasks);

    expect(stats['urgent']).toEqual({
      completed: 2,
      total: 5,
      percentage: 40,
    });
  });

  it('calculates stats for multiple tags independently', () => {
    const tasks: Task[] = [
      createTask(1, 'completed', 'Task 1', 'Project', ['urgent']),
      createTask(2, 'pending', 'Task 2', 'Project', ['urgent']),
      createTask(3, 'completed', 'Task 3', 'Project', ['backend']),
      createTask(4, 'completed', 'Task 4', 'Project', ['backend']),
      createTask(5, 'completed', 'Task 5', 'Project', ['backend']),
    ];

    const stats = calculateTagStats(tasks);

    expect(stats['urgent']).toEqual({
      completed: 1,
      total: 2,
      percentage: 50,
    });

    expect(stats['backend']).toEqual({
      completed: 3,
      total: 3,
      percentage: 100,
    });
  });

  it('handles tasks with multiple tags correctly', () => {
    const tasks: Task[] = [
      createTask(1, 'completed', 'Task 1', 'Project', ['urgent', 'backend']),
      createTask(2, 'pending', 'Task 2', 'Project', ['urgent', 'frontend']),
      createTask(3, 'completed', 'Task 3', 'Project', ['backend']),
    ];

    const stats = calculateTagStats(tasks);

    expect(stats['urgent']).toEqual({
      completed: 1,
      total: 2,
      percentage: 50,
    });

    expect(stats['backend']).toEqual({
      completed: 2,
      total: 2,
      percentage: 100,
    });

    expect(stats['frontend']).toEqual({
      completed: 0,
      total: 1,
      percentage: 0,
    });
  });

  it('ignores tasks with empty tags array', () => {
    const tasks: Task[] = [
      createTask(1, 'completed', 'Task 1', 'Project', []),
      createTask(2, 'completed', 'Task 2', 'Project', ['urgent']),
    ];

    const stats = calculateTagStats(tasks);

    expect(Object.keys(stats)).toHaveLength(1);
    expect(stats['urgent']).toEqual({
      completed: 1,
      total: 1,
      percentage: 100,
    });
  });

  it('ignores empty string tags', () => {
    const tasks: Task[] = [
      createTask(1, 'completed', 'Task 1', 'Project', ['', 'urgent']),
      createTask(2, 'completed', 'Task 2', 'Project', ['urgent']),
    ];

    const stats = calculateTagStats(tasks);

    expect(stats['']).toBeUndefined();
    expect(stats['urgent']).toEqual({
      completed: 2,
      total: 2,
      percentage: 100,
    });
  });

  it('returns empty object for empty task list', () => {
    const stats = calculateTagStats([]);
    expect(stats).toEqual({});
  });

  it('handles tag with zero completed tasks', () => {
    const tasks: Task[] = [
      createTask(1, 'pending', 'Task 1', 'Project', ['urgent']),
      createTask(2, 'pending', 'Task 2', 'Project', ['urgent']),
    ];

    const stats = calculateTagStats(tasks);

    expect(stats['urgent']).toEqual({
      completed: 0,
      total: 2,
      percentage: 0,
    });
  });

  it('rounds percentage correctly', () => {
    const tasks: Task[] = [
      createTask(1, 'completed', 'Task 1', 'Project', ['urgent']),
      createTask(2, 'pending', 'Task 2', 'Project', ['urgent']),
      createTask(3, 'pending', 'Task 3', 'Project', ['urgent']),
    ];

    const stats = calculateTagStats(tasks);

    expect(stats['urgent'].percentage).toBe(33);
  });
});

describe('Pin Functionality', () => {
  const testEmail = 'test@example.com';
  const taskUuid1 = 'task-uuid-123';
  const taskUuid2 = 'task-uuid-456';
  const taskUuid3 = 'task-uuid-789';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getPinnedTasks', () => {
    it('returns empty Set when no pinned tasks exist', () => {
      const result = getPinnedTasks(testEmail);
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('retrieves pinned tasks from localStorage', () => {
      const pinnedUuids = [taskUuid1, taskUuid2];
      const hashedKey = hashKey('pinnedTasks', testEmail);
      localStorage.setItem(hashedKey, JSON.stringify(pinnedUuids));

      const result = getPinnedTasks(testEmail);
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(2);
      expect(result.has(taskUuid1)).toBe(true);
      expect(result.has(taskUuid2)).toBe(true);
    });

    it('returns empty Set when localStorage data is corrupted', () => {
      const hashedKey = hashKey('pinnedTasks', testEmail);
      localStorage.setItem(hashedKey, 'invalid-json');

      const result = getPinnedTasks(testEmail);
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('uses hashed key for privacy', () => {
      const pinnedUuids = [taskUuid1];
      const hashedKey = hashKey('pinnedTasks', testEmail);
      localStorage.setItem(hashedKey, JSON.stringify(pinnedUuids));

      expect(localStorage.getItem('pinnedTasks')).toBeNull();
      expect(localStorage.getItem(hashedKey)).not.toBeNull();
    });

    it('returns different pinned tasks for different users', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      savePinnedTasks(email1, new Set([taskUuid1]));
      savePinnedTasks(email2, new Set([taskUuid2]));

      const result1 = getPinnedTasks(email1);
      const result2 = getPinnedTasks(email2);

      expect(result1.has(taskUuid1)).toBe(true);
      expect(result1.has(taskUuid2)).toBe(false);
      expect(result2.has(taskUuid2)).toBe(true);
      expect(result2.has(taskUuid1)).toBe(false);
    });
  });

  describe('savePinnedTasks', () => {
    it('saves pinned tasks to localStorage', () => {
      const pinnedTasks = new Set([taskUuid1, taskUuid2]);
      savePinnedTasks(testEmail, pinnedTasks);

      const hashedKey = hashKey('pinnedTasks', testEmail);
      const stored = localStorage.getItem(hashedKey);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed).toContain(taskUuid1);
      expect(parsed).toContain(taskUuid2);
      expect(parsed.length).toBe(2);
    });

    it('saves empty Set correctly', () => {
      const pinnedTasks = new Set<string>();
      savePinnedTasks(testEmail, pinnedTasks);

      const hashedKey = hashKey('pinnedTasks', testEmail);
      const stored = localStorage.getItem(hashedKey);
      expect(stored).toBe('[]');
    });

    it('overwrites existing pinned tasks', () => {
      savePinnedTasks(testEmail, new Set([taskUuid1, taskUuid2]));
      savePinnedTasks(testEmail, new Set([taskUuid3]));

      const result = getPinnedTasks(testEmail);
      expect(result.size).toBe(1);
      expect(result.has(taskUuid3)).toBe(true);
      expect(result.has(taskUuid1)).toBe(false);
      expect(result.has(taskUuid2)).toBe(false);
    });

    it('converts Set to Array for JSON serialization', () => {
      const pinnedTasks = new Set([taskUuid1, taskUuid2, taskUuid3]);
      savePinnedTasks(testEmail, pinnedTasks);

      const hashedKey = hashKey('pinnedTasks', testEmail);
      const stored = localStorage.getItem(hashedKey);
      const parsed = JSON.parse(stored!);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(3);
    });
  });

  describe('togglePinnedTask', () => {
    it('pins an unpinned task', () => {
      const result = togglePinnedTask(testEmail, taskUuid1);

      expect(result).toBe(true);
      const pinnedTasks = getPinnedTasks(testEmail);
      expect(pinnedTasks.has(taskUuid1)).toBe(true);
    });

    it('unpins a pinned task', () => {
      savePinnedTasks(testEmail, new Set([taskUuid1]));

      const result = togglePinnedTask(testEmail, taskUuid1);

      expect(result).toBe(false);
      const pinnedTasks = getPinnedTasks(testEmail);
      expect(pinnedTasks.has(taskUuid1)).toBe(false);
    });

    it('returns true when pinning', () => {
      const result = togglePinnedTask(testEmail, taskUuid1);
      expect(result).toBe(true);
    });

    it('returns false when unpinning', () => {
      togglePinnedTask(testEmail, taskUuid1);
      const result = togglePinnedTask(testEmail, taskUuid1);
      expect(result).toBe(false);
    });

    it('persists changes to localStorage', () => {
      togglePinnedTask(testEmail, taskUuid1);

      const hashedKey = hashKey('pinnedTasks', testEmail);
      const stored = localStorage.getItem(hashedKey);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed).toContain(taskUuid1);
    });

    it('maintains other pinned tasks when toggling', () => {
      savePinnedTasks(testEmail, new Set([taskUuid1, taskUuid2]));
      togglePinnedTask(testEmail, taskUuid3);

      const pinnedTasks = getPinnedTasks(testEmail);
      expect(pinnedTasks.has(taskUuid1)).toBe(true);
      expect(pinnedTasks.has(taskUuid2)).toBe(true);
      expect(pinnedTasks.has(taskUuid3)).toBe(true);
    });

    it('removes only the toggled task when unpinning', () => {
      savePinnedTasks(testEmail, new Set([taskUuid1, taskUuid2, taskUuid3]));
      togglePinnedTask(testEmail, taskUuid2);

      const pinnedTasks = getPinnedTasks(testEmail);
      expect(pinnedTasks.has(taskUuid1)).toBe(true);
      expect(pinnedTasks.has(taskUuid2)).toBe(false);
      expect(pinnedTasks.has(taskUuid3)).toBe(true);
      expect(pinnedTasks.size).toBe(2);
    });

    it('handles multiple toggles correctly', () => {
      togglePinnedTask(testEmail, taskUuid1);
      expect(isTaskPinned(testEmail, taskUuid1)).toBe(true);

      togglePinnedTask(testEmail, taskUuid1);
      expect(isTaskPinned(testEmail, taskUuid1)).toBe(false);

      togglePinnedTask(testEmail, taskUuid1);
      expect(isTaskPinned(testEmail, taskUuid1)).toBe(true);
    });
  });

  describe('isTaskPinned', () => {
    it('returns false for unpinned task', () => {
      const result = isTaskPinned(testEmail, taskUuid1);
      expect(result).toBe(false);
    });

    it('returns true for pinned task', () => {
      savePinnedTasks(testEmail, new Set([taskUuid1]));
      const result = isTaskPinned(testEmail, taskUuid1);
      expect(result).toBe(true);
    });

    it('returns false when no pinned tasks exist', () => {
      const result = isTaskPinned(testEmail, taskUuid1);
      expect(result).toBe(false);
    });

    it('returns false for task not in pinned list', () => {
      savePinnedTasks(testEmail, new Set([taskUuid1, taskUuid2]));
      const result = isTaskPinned(testEmail, taskUuid3);
      expect(result).toBe(false);
    });

    it('returns correct status after toggling', () => {
      expect(isTaskPinned(testEmail, taskUuid1)).toBe(false);

      togglePinnedTask(testEmail, taskUuid1);
      expect(isTaskPinned(testEmail, taskUuid1)).toBe(true);

      togglePinnedTask(testEmail, taskUuid1);
      expect(isTaskPinned(testEmail, taskUuid1)).toBe(false);
    });

    it('handles multiple pinned tasks correctly', () => {
      savePinnedTasks(testEmail, new Set([taskUuid1, taskUuid2, taskUuid3]));

      expect(isTaskPinned(testEmail, taskUuid1)).toBe(true);
      expect(isTaskPinned(testEmail, taskUuid2)).toBe(true);
      expect(isTaskPinned(testEmail, taskUuid3)).toBe(true);
      expect(isTaskPinned(testEmail, 'non-existent-uuid')).toBe(false);
    });

    it('is case-sensitive for UUIDs', () => {
      savePinnedTasks(testEmail, new Set([taskUuid1.toLowerCase()]));
      expect(isTaskPinned(testEmail, taskUuid1.toUpperCase())).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('complete pin workflow for single task', () => {
      expect(isTaskPinned(testEmail, taskUuid1)).toBe(false);

      togglePinnedTask(testEmail, taskUuid1);
      expect(isTaskPinned(testEmail, taskUuid1)).toBe(true);

      const pinnedTasks = getPinnedTasks(testEmail);
      expect(pinnedTasks.has(taskUuid1)).toBe(true);
      expect(pinnedTasks.size).toBe(1);

      togglePinnedTask(testEmail, taskUuid1);
      expect(isTaskPinned(testEmail, taskUuid1)).toBe(false);

      const emptyPinned = getPinnedTasks(testEmail);
      expect(emptyPinned.size).toBe(0);
    });

    it('complete pin workflow for multiple tasks', () => {
      togglePinnedTask(testEmail, taskUuid1);
      togglePinnedTask(testEmail, taskUuid2);
      togglePinnedTask(testEmail, taskUuid3);

      expect(isTaskPinned(testEmail, taskUuid1)).toBe(true);
      expect(isTaskPinned(testEmail, taskUuid2)).toBe(true);
      expect(isTaskPinned(testEmail, taskUuid3)).toBe(true);

      const pinnedTasks = getPinnedTasks(testEmail);
      expect(pinnedTasks.size).toBe(3);

      togglePinnedTask(testEmail, taskUuid2);
      expect(isTaskPinned(testEmail, taskUuid2)).toBe(false);
      expect(getPinnedTasks(testEmail).size).toBe(2);
    });

    it('handles multiple users independently', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      togglePinnedTask(email1, taskUuid1);
      togglePinnedTask(email2, taskUuid2);

      expect(isTaskPinned(email1, taskUuid1)).toBe(true);
      expect(isTaskPinned(email1, taskUuid2)).toBe(false);
      expect(isTaskPinned(email2, taskUuid1)).toBe(false);
      expect(isTaskPinned(email2, taskUuid2)).toBe(true);

      expect(getPinnedTasks(email1).size).toBe(1);
      expect(getPinnedTasks(email2).size).toBe(1);
    });

    it('persists across function calls', () => {
      togglePinnedTask(testEmail, taskUuid1);
      expect(isTaskPinned(testEmail, taskUuid1)).toBe(true);

      const retrieved = getPinnedTasks(testEmail);
      expect(retrieved.has(taskUuid1)).toBe(true);

      savePinnedTasks(testEmail, new Set([taskUuid1, taskUuid2]));
      expect(isTaskPinned(testEmail, taskUuid2)).toBe(true);

      const final = getPinnedTasks(testEmail);
      expect(final.size).toBe(2);
    });
  });
});
