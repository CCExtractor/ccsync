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

    if (response) {
      console.log('Task marked as completed successfully!');
    } else {
      console.error('Failed to mark task as completed');
    }
  } catch (error) {
    console.error('Error marking task as completed:', error);
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

    if (response) {
      console.log('Task marked as deleted successfully!');
    } else {
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
    return `Last updated ${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`;
  } else if (diffMinutes < 60) {
    return `Last updated ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `Last updated ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `Last updated ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
};

/**
 * Simple hash function for creating a hash of email + key
 * This prevents storing plain email addresses in localStorage
 */
export const hashKey = (key: string, email: string): string => {
  const str = key + email;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Get the set of pinned task UUIDs from localStorage
 */
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

/**
 * Save the set of pinned task UUIDs to localStorage
 */
export const savePinnedTasks = (
  email: string,
  pinnedUuids: Set<string>
): void => {
  const hashedKey = hashKey('pinnedTasks', email);
  localStorage.setItem(hashedKey, JSON.stringify([...pinnedUuids]));
};

/**
 * Toggle the pinned status of a task
 * Returns the new pinned state
 */
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

/**
 * Check if a task is pinned
 */
export const isTaskPinned = (email: string, taskUuid: string): boolean => {
  return getPinnedTasks(email).has(taskUuid);
};
