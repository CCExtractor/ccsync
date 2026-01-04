import { toast } from 'react-toastify';
import { url } from '@/components/utils/URLs';
import Dexie from 'dexie';
import { Task } from '@/components/utils/types';

class TasksDatabase extends Dexie {
  tasks: Dexie.Table<Task, string>;

  constructor() {
    super('tasksDB');
    this.version(1).stores({
      tasks: 'uuid, email, status, project',
    });
    this.tasks = this.table('tasks');
  }
}
const db = new TasksDatabase();

export interface RouteProps {
  href: string;
  label: string;
}

export type Props = {
  imgurl: string;
  email: string;
  encryptionSecret: string;
  origin: string;
  UUID: string;
  tasks: Task[] | null;
};

export const routeList: RouteProps[] = [
  { href: '#', label: 'Home' },
  { href: '#tasks', label: 'Tasks' },
  { href: '#setup-guide', label: 'Setup Guide' },
  { href: '#faq', label: 'FAQ' },
];

export const handleLogout = async () => {
  try {
    const response = await fetch(url.backendURL + 'auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    if (response.ok) {
      window.location.href = '/';
    } else {
      console.error('Failed to logout');
    }
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

export const deleteAllTasks = async (props: Props) => {
  const loadingToastId = toast.info(`Checking tasks for ${props.email}...`, {
    position: 'bottom-left',
    autoClose: false,
    hideProgressBar: true,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
  });

  try {
    const taskCount = await db.tasks.where('email').equals(props.email).count();

    if (taskCount === 0) {
      toast.update(loadingToastId, {
        render: `No tasks to delete for ${props.email}.`,
        type: 'error',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }
    await db.tasks.where('email').equals(props.email).delete();

    toast.update(loadingToastId, {
      render: `All ${taskCount} tasks for ${props.email} deleted successfully!`,
      type: 'success',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  } catch (error) {
    toast.update(loadingToastId, {
      render: `Error deleting tasks for ${props.email}: ${error}`,
      type: 'error',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    console.error(`Error deleting tasks for ${props.email}:`, error);
  }
};
