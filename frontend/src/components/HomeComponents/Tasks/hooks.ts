import { Task } from '@/components/utils/types';
import Dexie from 'dexie';

export const fetchTaskwarriorTasks = async ({
  email,
  encryptionSecret,
  UUID,
  backendURL,
}: {
  email: string;
  encryptionSecret: string;
  UUID: string;
  backendURL: string;
}) => {
  const fullURL = `${backendURL}tasks`;

  const response = await fetch(fullURL, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': email,
      'X-Encryption-Secret': encryptionSecret,
      'X-User-UUID': UUID,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tasks from backend');
  }

  return response.json();
};

export const addTaskToBackend = async ({
  email,
  encryptionSecret,
  UUID,
  description,
  project,
  priority,
  due,
  start,
  entry,
  wait,
  end,
  recur,
  tags,
  annotations,
  depends,
  backendURL,
}: {
  email: string;
  encryptionSecret: string;
  UUID: string;
  description: string;
  project: string;
  priority: string;
  due?: string;
  start: string;
  entry: string;
  wait: string;
  end?: string;
  recur: string;
  tags: string[];
  annotations: { entry: string; description: string }[];
  depends?: string[];
  backendURL: string;
}) => {
  const requestBody: any = {
    email,
    encryptionSecret,
    UUID,
    description,
    project,
    priority,
    entry,
    wait,
    tags,
  };

  if (due !== undefined && due !== '') {
    requestBody.due = due;
  }

  if (start !== undefined && start !== '') {
    requestBody.start = start;
  }

  if (depends && depends.length > 0) {
    requestBody.depends = depends;
  }

  if (end !== undefined && end !== '') {
    requestBody.end = end;
  }

  if (recur !== undefined && recur !== '') {
    requestBody.recur = recur;
  }

  requestBody.annotations = annotations.filter(
    (annotation) =>
      annotation.description && annotation.description.trim() !== ''
  );

  const response = await fetch(`${backendURL}add-task`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(requestBody),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to add task');
  }

  return response;
};

export const editTaskOnBackend = async ({
  email,
  encryptionSecret,
  UUID,
  description,
  tags,
  taskUUID,
  backendURL,
  project,
  start,
  entry,
  wait,
  end,
  depends,
  due,
  recur,
  annotations,
}: {
  email: string;
  encryptionSecret: string;
  UUID: string;
  description: string;
  tags: string[];
  taskUUID: string;
  backendURL: string;
  project: string;
  start: string;
  entry: string;
  wait: string;
  end: string;
  depends: string[];
  due: string;
  recur: string;
  annotations: { entry: string; description: string }[];
}) => {
  const response = await fetch(`${backendURL}edit-task`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({
      email,
      encryptionSecret,
      UUID,
      taskUUID,
      description,
      tags,
      project,
      start,
      entry,
      wait,
      end,
      depends,
      due,
      recur,
      annotations,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('321' + errorText || 'Failed to edit task');
  }

  return response;
};

export const modifyTaskOnBackend = async ({
  email,
  encryptionSecret,
  UUID,
  taskUUID,
  description,
  project,
  priority,
  status,
  due,
  tags,
  backendURL,
}: {
  email: string;
  encryptionSecret: string;
  UUID: string;
  taskUUID: string;
  description: string;
  project: string;
  priority: string;
  status: string;
  due: string;
  tags: string[];
  backendURL: string;
}) => {
  const response = await fetch(`${backendURL}modify-task`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({
      email,
      encryptionSecret,
      UUID,
      taskuuid: taskUUID,
      description,
      project,
      priority,
      status,
      due,
      tags,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to modify task');
  }

  return response;
};

export class TasksDatabase extends Dexie {
  tasks: Dexie.Table<Task, string>;

  constructor() {
    super('tasksDB');
    this.version(1).stores({
      tasks: 'uuid, email, status, project',
    });
    this.tasks = this.table('tasks');
  }
}
