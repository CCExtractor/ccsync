import { toast } from 'react-toastify';
import {
  // formattedDate,
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

// describe('formattedDate', () => {
//   it('formats valid ISO date string correctly', () => {
//     const dateString = '2023-06-17T12:00:00Z';
//     expect(formattedDate(dateString)).toBe('Jun 17, 2023, 5:30:00 PM');
//   });

//   it('returns input string if date parsing fails', () => {
//     const invalidDateString = 'invalid-date-string';
//     expect(formattedDate(invalidDateString)).toBe(invalidDateString);
//   });
// });

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
