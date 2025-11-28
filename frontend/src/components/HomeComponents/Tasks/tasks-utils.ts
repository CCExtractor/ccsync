import { Task } from '@/components/utils/types';
import { url } from '@/components/utils/URLs';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { CompletionSummary, LabelMaps } from './types';
import { COMPLETED_STATUS } from './constants';

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

export const roundPercentage = (completed: number, total: number) =>
  total === 0 ? 0 : Math.round((completed / total) * 100);

export const aggregateProjectStats = (tasks: Task[]): CompletionSummary =>
  tasks.reduce((acc, task) => {
    if (!task.project) {
      return acc;
    }
    if (!acc[task.project]) {
      acc[task.project] = { total: 0, completed: 0 };
    }
    acc[task.project].total += 1;
    if (task.status === COMPLETED_STATUS) {
      acc[task.project].completed += 1;
    }
    return acc;
  }, {} as CompletionSummary);

export const aggregateTagStats = (tasks: Task[]): CompletionSummary =>
  tasks.reduce((acc, task) => {
    (task.tags || []).forEach((tag) => {
      if (!tag) {
        return;
      }
      if (!acc[tag]) {
        acc[tag] = { total: 0, completed: 0 };
      }
      acc[tag].total += 1;
      if (task.status === COMPLETED_STATUS) {
        acc[tag].completed += 1;
      }
    });
    return acc;
  }, {} as CompletionSummary);

export const buildLabelMaps = (
  keys: string[],
  stats: CompletionSummary
): LabelMaps =>
  keys.reduce(
    (acc, key) => {
      const { total = 0, completed = 0 } = stats[key] ?? {
        total: 0,
        completed: 0,
      };
      const percentage = roundPercentage(completed, total);
      const label = `${key}    ${completed}/${total}    ${percentage}%`;
      acc.options.push(label);
      acc.valueToDisplay[key] = label;
      acc.displayToValue[label] = key;
      return acc;
    },
    { options: [], valueToDisplay: {}, displayToValue: {} } as LabelMaps
  );
