import {
  fetchTaskwarriorTasks,
  addTaskToBackend,
  modifyTaskOnBackend,
  editTaskOnBackend,
  TasksDatabase,
} from '../hooks';

global.fetch = jest.fn() as jest.Mock;

afterEach(() => {
  jest.resetAllMocks();
});

describe('fetchTaskwarriorTasks', () => {
  test('Fetches Task Sucessfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: '1', description: 'Test task' }],
    });

    const result = await fetchTaskwarriorTasks({
      email: 'test@example.com',
      encryptionSecret: 'mockEncryptionSecret',
      UUID: 'mockUUID',
      backendURL: 'http://backend/',
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: '1', description: 'Test task' }]);
  });

  test('Throws erros when response is not okk', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    await expect(
      fetchTaskwarriorTasks({
        email: 'test@example.com',
        encryptionSecret: 'mockEncryptionSecret',
        UUID: 'mockUUID',
        backendURL: 'http://backend/',
      })
    ).rejects.toThrow('Failed to fetch tasks from backend');
  });
});

describe('addTaskToBackend', () => {
  test('sends correct request body with optional fields', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    await addTaskToBackend({
      email: 'test@example.com',
      encryptionSecret: 'mockEncryptionSecret',
      UUID: 'mockUUID',
      description: 'New Task',
      project: 'Test',
      priority: 'H',
      start: '2025-01-01',
      entry: '2025-01-01',
      wait: '',
      recur: '',
      tags: ['work'],
      annotations: [
        { entry: '1', description: 'note' },
        { entry: '2', description: '' },
      ],
      backendURL: 'http://backend/',
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);

    expect(body.description).toBe('New Task');
    expect(body.tags).toEqual(['work']);
    expect(body.annotations).toHaveLength(1);
    expect(body.annotations[0].description).toBe('note');
  });

  test('throws error when backend responds back with error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => 'Backend error',
    });

    await expect(
      addTaskToBackend({
        email: 'test@example.com',
        encryptionSecret: 'mockEncryptionSecret',
        UUID: 'mockUUID',
        description: 'New Task',
        project: '',
        priority: '',
        start: '',
        entry: '',
        wait: '',
        recur: '',
        tags: [],
        annotations: [],
        backendURL: 'http://backend/',
      })
    ).rejects.toThrow('Backend error');
  });
});

describe('editTaskOnBackend', () => {
  test('edits task successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    const response = await editTaskOnBackend({
      email: 'test@example.com',
      encryptionSecret: 'mockEncryptionSecret',
      UUID: 'mockUUID',
      taskUUID: 'taskUUID',
      description: 'Updated',
      tags: [],
      project: '',
      start: '',
      entry: '',
      wait: '',
      end: '',
      depends: [],
      due: '',
      recur: '',
      annotations: [],
      backendURL: 'http://backend/',
    });

    expect(response).toBeDefined();
  });

  test('throws error on failure', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => 'Edit failed',
    });

    await expect(
      editTaskOnBackend({
        email: 'test@example.com',
        encryptionSecret: 'mockEncryptionSecret',
        UUID: 'mockUUID',
        taskUUID: 'taskUUID',
        description: 'Updated',
        tags: [],
        project: '',
        start: '',
        entry: '',
        wait: '',
        end: '',
        depends: [],
        due: '',
        recur: '',
        annotations: [],
        backendURL: 'http://backend/',
      })
    ).rejects.toThrow('Edit failed');
  });
});

describe('modifyTaskOnBackend', () => {
  test('edits task successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    const response = await modifyTaskOnBackend({
      email: 'test@example.com',
      encryptionSecret: 'mockEncryptionSecret',
      UUID: 'mockUUID',
      taskUUID: 'taskUUID',
      description: 'Updated',
      tags: [],
      project: '',
      due: '',
      priority: 'H',
      status: 'pending',
      backendURL: 'http://backend/',
    });

    expect(response).toBeDefined();
  });

  test('throws error on failure', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => 'Edit failed',
    });

    await expect(
      modifyTaskOnBackend({
        email: 'test@example.com',
        encryptionSecret: 'mockEncryptionSecret',
        UUID: 'mockUUID',
        taskUUID: 'taskUUID',
        description: 'Updated',
        tags: [],
        project: '',
        due: '',
        priority: 'H',
        status: 'pending',
        backendURL: 'http://backend/',
      })
    ).rejects.toThrow('Edit failed');
  });
});

describe('TaskDatabase', () => {
  test('initializes dexie database with tasks table', () => {
    const db = new TasksDatabase();

    expect(db.tasks).toBeDefined();
    expect(db.name).toBe('tasksDB');
  });
});
