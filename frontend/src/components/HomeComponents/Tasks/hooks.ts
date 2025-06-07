import { Task } from "@/components/utils/types";
import Dexie from "dexie";

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
  const fullURL =
    backendURL +
    `/tasks?email=${encodeURIComponent(
      email
    )}&encryptionSecret=${encodeURIComponent(
      encryptionSecret
    )}&UUID=${encodeURIComponent(UUID)}`;

  const response = await fetch(fullURL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
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
  tags,
  backendURL,
}: {
  email: string;
  encryptionSecret: string;
  UUID: string;
  description: string;
  project: string;
  priority: string;
  due: string;
  tags: string[];
  backendURL: string;
}) => {
  const response = await fetch(`${backendURL}add-task`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      encryptionSecret,
      UUID,
      description,
      project,
      priority,
      due,
      tags,
    }),
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
  taskID,
  backendURL,
}: {
  email: string;
  encryptionSecret: string;
  UUID: string;
  description: string;
  tags: string[];
  taskID: string;
  backendURL: string;
}) => {
  const response = await fetch(`${backendURL}edit-task`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      encryptionSecret,
      UUID,
      taskID,
      description,
      tags,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to edit task');
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