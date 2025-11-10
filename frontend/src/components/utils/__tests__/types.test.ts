import { User, Props, Task } from '../types';

describe('User interface', () => {
  it('should accept valid User object', () => {
    const user: User = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      picture: 'https://example.com/avatar.jpg',
    };

    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john.doe@example.com');
    expect(user.picture).toBe('https://example.com/avatar.jpg');
  });

  it('should throw error if required fields are missing', () => {
    // Uncommenting the following line should result in a compilation error:
    // this is because other fields would be missing
    // const user: User = { name: 'John Doe' };
  });
});

describe('Props interface', () => {
  it('should accept valid Props object', () => {
    const props: Props = {
      name: 'ComponentName',
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      encryption_secret: 'random-secret-key',
    };

    expect(props.name).toBe('ComponentName');
    expect(props.uuid).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(props.encryption_secret).toBe('random-secret-key');
  });
});

describe('Task interface', () => {
  it('should accept valid Task object', () => {
    const task: Task = {
      id: 1,
      description: 'Example task description',
      project: 'Project ABC',
      tags: ['tag1', 'tag2'],
      status: 'in progress',
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      urgency: 1,
      priority: 'high',
      due: '2024-06-20',
      start: '2024-05-20',
      end: '2024-06-25',
      entry: '2024-06-18',
      wait: '2025-07-18',
      modified: '2024-06-19',
      depends: ['123e4567', '123e4567'],
      rtype: 'any',
      recur: 'none',
      email: 'test@example.com',
    };

    expect(task.id).toBe(1);
    expect(task.description).toBe('Example task description');
    expect(task.project).toBe('Project ABC');
    expect(task.tags).toEqual(['tag1', 'tag2']);
    expect(task.status).toBe('in progress');
    expect(task.uuid).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(task.urgency).toBe(1);
    expect(task.priority).toBe('high');
    expect(task.due).toBe('2024-06-20');
    expect(task.end).toBe('2024-06-25');
    expect(task.entry).toBe('2024-06-18');
    expect(task.modified).toBe('2024-06-19');
    expect(task.email).toBe('test@example.com');
  });
  it('should accept valid Task object with optional isUnsynced field', () => {
    const unsyncedTask: Task = {
      id: 2,
      description: 'An unsynced task',
      project: 'Project B',
      tags: [],
      status: 'pending',
      uuid: 'uuid-2',
      urgency: 0,
      priority: 'M',
      due: '',
      start: '',
      end: '',
      entry: '2025-11-10',
      wait: '',
      modified: '2025-11-10',
      depends: [],
      rtype: '',
      recur: '',
      email: 'test@example.com',
      isUnsynced: true,
    };

    expect(unsyncedTask.id).toBe(2);
    expect(unsyncedTask.isUnsynced).toBe(true);
  });
});
