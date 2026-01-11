import { Task } from '@/components/utils/types';
import { url } from '@/components/utils/URLs';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';

export type Props = {
  email: string;
  encryptionSecret: string;
  origin: string;
  UUID: string;
};

export const sortTasks = (tasks: Task[], order: 'asc' | 'desc') => {
  return tasks.sort((a, b) => {
    if (a.status < b.status) return order === 'asc' ? -1 : 1;
    if (a.status > b.status) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const markTaskAsCompleted = async (
  email: string,
  encryptionSecret: string,
  UUID: string,
  taskuuid: string
) => {
  try {
    const backendURL = url.backendURL + `complete-task`;

    const response = await fetch(backendURL, {
      method: 'POST',
      body: JSON.stringify({
        email: email,
        encryptionSecret: encryptionSecret,
        UUID: UUID,
        taskuuid: taskuuid,
      }),
    });

    if (!response) {
      console.error('Failed to mark task as completed');
    }
  } catch (error) {
    console.error('Error marking task as completed:', error);
  }
};

export const bulkMarkTasksAsCompleted = async (
  email: string,
  encryptionSecret: string,
  UUID: string,
  taskUUIDs: string[]
) => {
  try {
    const backendURL = url.backendURL + `complete-tasks`;

    const response = await fetch(backendURL, {
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

    if (response.ok) {
      toast.success(
        `${taskUUIDs.length} ${
          taskUUIDs.length === 1 ? 'task' : 'tasks'
        } marked as completed.`
      );
      return true;
    } else {
      toast.error('Bulk completion failed!');
      console.error('Failed bulk completion');
      return false;
    }
  } catch (error) {
    console.error('Error in bulk complete:', error);
    toast.error('Bulk complete failed');
    return false;
  }
};

export const bulkMarkTasksAsDeleted = async (
  email: string,
  encryptionSecret: string,
  UUID: string,
  taskUUIDs: string[]
) => {
  try {
    const backendURL = url.backendURL + `delete-tasks`;

    const response = await fetch(backendURL, {
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

    if (response.ok) {
      toast.success(
        `${taskUUIDs.length} ${
          taskUUIDs.length === 1 ? 'task' : 'tasks'
        } deleted.`
      );
      return true;
    } else {
      toast.error('Bulk deletion failed!');
      console.error('Failed bulk deletion');
      return false;
    }
  } catch (error) {
    console.error('Error in bulk delete:', error);
    toast.error('Bulk delete failed');
    return false;
  }
};

export const markTaskAsDeleted = async (
  email: string,
  encryptionSecret: string,
  UUID: string,
  taskuuid: string
) => {
  try {
    const backendURL = url.backendURL + `delete-task`;

    const response = await fetch(backendURL, {
      method: 'POST',
      body: JSON.stringify({
        email: email,
        encryptionSecret: encryptionSecret,
        UUID: UUID,
        taskuuid: taskuuid,
      }),
    });

    if (!response) {
      console.error('Failed to mark task as deleted');
    }
  } catch (error) {
    console.error('Error marking task as deleted:', error);
  }
};

export const getDisplayedPages = (totalPages: number, currentPage: number) => {
  const pages: number[] = [];
  if (totalPages <= 3) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage === 1) {
      pages.push(currentPage, currentPage + 1, currentPage + 2);
    } else if (currentPage === totalPages) {
      pages.push(currentPage - 2, currentPage - 1, currentPage);
    } else {
      pages.push(currentPage - 1, currentPage, currentPage + 1);
    }
  }
  return pages;
};

export const formattedDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'PPpp');
  } catch (error) {
    return dateString;
  }
};

export const parseTaskwarriorDate = (dateString: string) => {
  if (!dateString) return null;

  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  const hour = dateString.substring(9, 11);
  const min = dateString.substring(11, 13);
  const sec = dateString.substring(13, 15);
  const parsed = `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;

  const date = new Date(parsed);
  return isNaN(date.getTime()) ? null : date;
};

export const isOverdue = (due?: string) => {
  if (!due) return false;

  const dueDate = parseTaskwarriorDate(due);
  if (!dueDate) return false;
  dueDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
};

export const sortTasksById = (tasks: Task[], order: 'asc' | 'desc') => {
  return tasks.sort((a, b) => {
    if (order === 'asc') {
      return a.id < b.id ? -1 : 1;
    } else {
      return b.id < a.id ? -1 : 1;
    }
  });
};

export const handleCopy = (text: string) => {
  toast.success(`${text} copied to clipboard!`, {
    position: 'bottom-left',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

export const handleDate = (v: string) => {
  const date = new Date(v);
  const isValid =
    !isNaN(date.getTime()) && v === date.toISOString().split('T')[0];

  if (!isValid) {
    toast.error('Invalid Date Format. Please use the YYYY-MM-DD format.', {
      position: 'bottom-left',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    return false;
  }
  return true;
};

export const getTimeSinceLastSync = (
  lastSyncTimestamp: number | null
): string => {
  if (!lastSyncTimestamp) {
    return 'Never synced';
  }

  const now = Date.now();
  const diffMs = now - lastSyncTimestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return `Last updated ${diffSeconds} second${
      diffSeconds !== 1 ? 's' : ''
    } ago`;
  } else if (diffMinutes < 60) {
    return `Last updated ${diffMinutes} minute${
      diffMinutes !== 1 ? 's' : ''
    } ago`;
  } else if (diffHours < 24) {
    return `Last updated ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `Last updated ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
};

export const hashKey = (key: string, email: string): string => {
  const str = key + email;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

export const getPinnedTasks = (email: string): Set<string> => {
  const hashedKey = hashKey('pinnedTasks', email);
  const stored = localStorage.getItem(hashedKey);
  if (!stored) return new Set();
  try {
    return new Set(JSON.parse(stored));
  } catch {
    return new Set();
  }
};

export const savePinnedTasks = (
  email: string,
  pinnedUuids: Set<string>
): void => {
  const hashedKey = hashKey('pinnedTasks', email);
  localStorage.setItem(hashedKey, JSON.stringify([...pinnedUuids]));
};

export const togglePinnedTask = (email: string, taskUuid: string): boolean => {
  const pinnedTasks = getPinnedTasks(email);
  const isPinned = pinnedTasks.has(taskUuid);

  if (isPinned) {
    pinnedTasks.delete(taskUuid);
  } else {
    pinnedTasks.add(taskUuid);
  }

  savePinnedTasks(email, pinnedTasks);
  return !isPinned;
};

export const isTaskPinned = (email: string, taskUuid: string): boolean => {
  return getPinnedTasks(email).has(taskUuid);
};

export const calculateProjectStats = (
  tasks: Task[]
): Record<string, { completed: number; total: number; percentage: number }> => {
  const stats: Record<
    string,
    { completed: number; total: number; percentage: number }
  > = {};

  tasks.forEach((task) => {
    const project = task.project;
    if (project && project !== '') {
      if (!stats[project]) {
        stats[project] = { completed: 0, total: 0, percentage: 0 };
      }

      stats[project].total += 1;
      if (task.status === 'completed') {
        stats[project].completed += 1;
      }
    }
  });

  // Calculate percentages
  Object.keys(stats).forEach((project) => {
    const { completed, total } = stats[project];
    stats[project].percentage =
      total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  return stats;
};

export const calculateTagStats = (
  tasks: Task[]
): Record<string, { completed: number; total: number; percentage: number }> => {
  const stats: Record<
    string,
    { completed: number; total: number; percentage: number }
  > = {};

  tasks.forEach((task) => {
    const tags = task.tags || [];
    tags.forEach((tag) => {
      if (tag && tag !== '') {
        if (!stats[tag]) {
          stats[tag] = { completed: 0, total: 0, percentage: 0 };
        }

        stats[tag].total += 1;
        if (task.status === 'completed') {
          stats[tag].completed += 1;
        }
      }
    });
  });

  Object.keys(stats).forEach((tag) => {
    const { completed, total } = stats[tag];
    stats[tag].percentage =
      total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  return stats;
};
