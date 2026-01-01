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

  test('sends request with correct URL and headers', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchTaskwarriorTasks({
      email: 'user@test.com',
      encryptionSecret: 'secret123',
      UUID: 'uuid123',
      backendURL: 'http://localhost:8080/',
    });

    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/tasks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': 'user@test.com',
        'X-Encryption-Secret': 'secret123',
        'X-User-UUID': 'uuid123',
      },
    });
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

  test('handles network errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(
      fetchTaskwarriorTasks({
        email: 'test@example.com',
        encryptionSecret: 'mockEncryptionSecret',
        UUID: 'mockUUID',
        backendURL: 'http://backend/',
      })
    ).rejects.toThrow('Network error');
  });
});

describe('addTaskToBackend', () => {
  test('sends correct request body with all required fields', async () => {
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

    expect(fetch).toHaveBeenCalledWith('http://backend/add-task', {
      method: 'POST',
      body: expect.any(String),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);

    expect(body.email).toBe('test@example.com');
    expect(body.description).toBe('New Task');
    expect(body.tags).toEqual(['work']);
    expect(body.annotations).toHaveLength(1);
    expect(body.annotations[0].description).toBe('note');
  });

  test('includes optional due field when provided', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    await addTaskToBackend({
      email: 'test@example.com',
      encryptionSecret: 'secret',
      UUID: 'uuid',
      description: 'Task with due',
      project: '',
      priority: '',
      due: '2025-12-31',
      start: '',
      entry: '',
      wait: '',
      recur: '',
      tags: [],
      annotations: [],
      backendURL: 'http://backend/',
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.due).toBe('2025-12-31');
  });

  test('excludes due field when empty string', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    await addTaskToBackend({
      email: 'test@example.com',
      encryptionSecret: 'secret',
      UUID: 'uuid',
      description: 'Task without due',
      project: '',
      priority: '',
      due: '',
      start: '',
      entry: '',
      wait: '',
      recur: '',
      tags: [],
      annotations: [],
      backendURL: 'http://backend/',
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.due).toBeUndefined();
  });

  test('includes start field when provided', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    await addTaskToBackend({
      email: 'test@example.com',
      encryptionSecret: 'secret',
      UUID: 'uuid',
      description: 'Task',
      project: '',
      priority: '',
      start: '2025-01-15',
      entry: '',
      wait: '',
      recur: '',
      tags: [],
      annotations: [],
      backendURL: 'http://backend/',
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.start).toBe('2025-01-15');
  });

  test('includes depends field when array has items', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    await addTaskToBackend({
      email: 'test@example.com',
      encryptionSecret: 'secret',
      UUID: 'uuid',
      description: 'Task',
      project: '',
      priority: '',
      start: '',
      entry: '',
      wait: '',
      recur: '',
      tags: [],
      annotations: [],
      depends: ['task1', 'task2'],
      backendURL: 'http://backend/',
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.depends).toEqual(['task1', 'task2']);
  });

  test('excludes depends field when empty array', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    await addTaskToBackend({
      email: 'test@example.com',
      encryptionSecret: 'secret',
      UUID: 'uuid',
      description: 'Task',
      project: '',
      priority: '',
      start: '',
      entry: '',
      wait: '',
      recur: '',
      tags: [],
      annotations: [],
      depends: [],
      backendURL: 'http://backend/',
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.depends).toBeUndefined();
  });

  test('includes end field when provided', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    await addTaskToBackend({
      email: 'test@example.com',
      encryptionSecret: 'secret',
      UUID: 'uuid',
      description: 'Task',
      project: '',
      priority: '',
      start: '',
      entry: '',
      wait: '',
      end: '2025-02-01',
      recur: '',
      tags: [],
      annotations: [],
      backendURL: 'http://backend/',
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.end).toBe('2025-02-01');
  });

  test('includes recur field when provided', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    await addTaskToBackend({
      email: 'test@example.com',
      encryptionSecret: 'secret',
      UUID: 'uuid',
      description: 'Task',
      project: '',
      priority: '',
      start: '',
      entry: '',
      wait: '',
      recur: 'weekly',
      tags: [],
      annotations: [],
      backendURL: 'http://backend/',
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.recur).toBe('weekly');
  });

  test('filters out empty annotations', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    await addTaskToBackend({
      email: 'test@example.com',
      encryptionSecret: 'secret',
      UUID: 'uuid',
      description: 'Task',
      project: '',
      priority: '',
      start: '',
      entry: '',
      wait: '',
      recur: '',
      tags: [],
      annotations: [
        { entry: '1', description: 'valid note' },
        { entry: '2', description: '' },
        { entry: '3', description: '   ' },
      ],
      backendURL: 'http://backend/',
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.annotations).toHaveLength(1);
    expect(body.annotations[0].description).toBe('valid note');
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

  test('throws default error message when backend error text is empty', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => '',
    });

    await expect(
      addTaskToBackend({
        email: 'test@example.com',
        encryptionSecret: 'secret',
        UUID: 'uuid',
        description: 'Task',
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
    ).rejects.toThrow('Failed to add task');
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

  test('sends all task fields in request body', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    await editTaskOnBackend({
      email: 'user@test.com',
      encryptionSecret: 'secret',
      UUID: 'user-uuid',
      taskUUID: 'task-uuid-123',
      description: 'Updated description',
      tags: ['tag1', 'tag2'],
      project: 'MyProject',
      start: '2025-01-01',
      entry: '2025-01-01',
      wait: '2025-01-05',
      end: '2025-02-01',
      depends: ['dep1'],
      due: '2025-01-31',
      recur: 'monthly',
      annotations: [{ entry: '1', description: 'note' }],
      backendURL: 'http://backend/',
    });

    expect(fetch).toHaveBeenCalledWith('http://backend/edit-task', {
      method: 'POST',
      body: expect.any(String),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.email).toBe('user@test.com');
    expect(body.taskUUID).toBe('task-uuid-123');
    expect(body.description).toBe('Updated description');
    expect(body.tags).toEqual(['tag1', 'tag2']);
    expect(body.project).toBe('MyProject');
    expect(body.start).toBe('2025-01-01');
    expect(body.depends).toEqual(['dep1']);
    expect(body.annotations).toEqual([{ entry: '1', description: 'note' }]);
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
    ).rejects.toThrow('321Edit failed');
  });

  test('throws default error message when backend returns empty error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => '',
    });

    await expect(
      editTaskOnBackend({
        email: 'test@example.com',
        encryptionSecret: 'secret',
        UUID: 'uuid',
        taskUUID: 'task-uuid',
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
    ).rejects.toThrow('321');
  });
});

describe('modifyTaskOnBackend', () => {
  test('modifies task successfully', async () => {
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
    expect(response.ok).toBe(true);
  });

  test('sends correct request body with taskuuid field name', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    await modifyTaskOnBackend({
      email: 'user@test.com',
      encryptionSecret: 'secret',
      UUID: 'user-uuid',
      taskUUID: 'task-uuid-123',
      description: 'Modified task',
      project: 'Work',
      priority: 'M',
      status: 'completed',
      due: '2025-12-31',
      tags: ['important'],
      backendURL: 'http://backend/',
    });

    expect(fetch).toHaveBeenCalledWith('http://backend/modify-task', {
      method: 'POST',
      body: expect.any(String),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.taskuuid).toBe('task-uuid-123');
    expect(body.description).toBe('Modified task');
    expect(body.project).toBe('Work');
    expect(body.priority).toBe('M');
    expect(body.status).toBe('completed');
    expect(body.due).toBe('2025-12-31');
    expect(body.tags).toEqual(['important']);
  });

  test('throws error on failure', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => 'Modify failed',
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
    ).rejects.toThrow('Modify failed');
  });

  test('throws default error message when backend returns empty error text', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => '',
    });

    await expect(
      modifyTaskOnBackend({
        email: 'test@example.com',
        encryptionSecret: 'secret',
        UUID: 'uuid',
        taskUUID: 'task-uuid',
        description: 'Updated',
        tags: [],
        project: '',
        due: '',
        priority: 'L',
        status: 'pending',
        backendURL: 'http://backend/',
      })
    ).rejects.toThrow('Failed to modify task');
  });
});

describe('TasksDatabase', () => {
  test('initializes dexie database with tasks table', () => {
    const db = new TasksDatabase();

    expect(db.tasks).toBeDefined();
    expect(db.name).toBe('tasksDB');
  });

  test('has correct version number', () => {
    const db = new TasksDatabase();
    expect(db.verno).toBe(1);
  });

  test('tasks table exists and is a Dexie Table', () => {
    const db = new TasksDatabase();
    expect(db.tasks).toBeDefined();
    expect(db.tables.length).toBeGreaterThan(0);
    expect(db.table('tasks')).toBeDefined();
  });
});
