import { useEffect, useState, useCallback, useRef } from 'react';
import { useEditTask } from './UseEditTask';
import { Task, Annotation } from '../../utils/types';
import { ReportsView } from './ReportsView';
import Fuse from 'fuse.js';
import { useHotkeys } from '@/components/utils/use-hotkeys';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { ArrowUpDown, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getDisplayedPages,
  markTaskAsCompleted,
  bulkMarkTasksAsCompleted,
  markTaskAsDeleted,
  bulkMarkTasksAsDeleted,
  Props,
  sortTasks,
  sortTasksById,
  getTimeSinceLastSync,
  hashKey,
} from './tasks-utils';
import Pagination from './Pagination';
import { url } from '@/components/utils/URLs';
import { MultiSelectFilter } from '@/components/ui/multi-select';
import BottomBar from '../BottomBar/BottomBar';
import {
  addTaskToBackend,
  editTaskOnBackend,
  modifyTaskOnBackend,
  fetchTaskwarriorTasks,
  TasksDatabase,
} from './hooks';
import { debounce } from '@/components/utils/utils';
import { Taskskeleton } from './TaskSkeleton';
import { Key } from '@/components/ui/key-button';
import { AddTaskdialog } from './AddTaskDialog';
import { TaskDialog } from './TaskDialog';
import { TaskFormData } from '../../utils/types';

const db = new TasksDatabase();
export let syncTasksWithTwAndDb: () => any;

export const Tasks = (
  props: Props & {
    isLoading: boolean;
    setIsLoading: (val: boolean) => void;
  }
) => {
  const [showReports, setShowReports] = useState(false);
  const [uniqueTags, setUniqueTags] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uniqueProjects, setUniqueProjects] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [tempTasks, setTempTasks] = useState<Task[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const status = ['pending', 'completed', 'deleted', 'overdue'];
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [idSortOrder, setIdSortOrder] = useState<'asc' | 'desc'>('asc');

  const [newTask, setNewTask] = useState<TaskFormData>({
    description: '',
    priority: '',
    project: '',
    due: '',
    start: '',
    entry: '',
    wait: '',
    end: '',
    recur: '',
    tags: [],
    annotations: [],
    depends: [],
  });
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [_isDialogOpen, setIsDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [_selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editedTags, setEditedTags] = useState<string[]>(
    _selectedTask?.tags || []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [selectedTaskUUIDs, setSelectedTaskUUIDs] = useState<string[]>([]);
  const [unsyncedTaskUuids, setUnsyncedTaskUuids] = useState<Set<string>>(
    new Set()
  );
  const tableRef = useRef<HTMLDivElement>(null);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const {
    state: editState,
    updateState: updateEditState,
    resetState: resetEditState,
  } = useEditTask(_selectedTask);

  // Handler for dialog open/close

  const isOverdue = (due?: string) => {
    if (!due) return false;

    const parsed = new Date(
      due.replace(
        /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
        '$1-$2-$3T$4:$5:$6Z'
      )
    );

    const dueDate = new Date(parsed);
    dueDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dueDate < today;
  };

  const debouncedSearch = debounce((value: string) => {
    setDebouncedTerm(value);
    setCurrentPage(1);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleTasksPerPageChange = (newTasksPerPage: number) => {
    setTasksPerPage(newTasksPerPage);
    setCurrentPage(1);

    const hashedKey = hashKey('tasksPerPage', props.email);
    localStorage.setItem(hashedKey, newTasksPerPage.toString());
  };

  const [tasksPerPage, setTasksPerPage] = useState<number>(10);
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tempTasks.slice(indexOfFirstTask, indexOfLastTask);
  const emptyRows = tasksPerPage - currentTasks.length;
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const totalPages = Math.ceil(tempTasks.length / tasksPerPage) || 1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        _isDialogOpen ||
        isAddTaskOpen ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, currentTasks.length - 1));
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }

      if (e.key === 'e') {
        e.preventDefault();
        const task = currentTasks[selectedIndex];
        if (task) {
          document.getElementById(`task-row-${task.id}`)?.click();
        }
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [hotkeysEnabled, selectedIndex, currentTasks]);

  useEffect(() => {
    const hashedKey = hashKey('tasksPerPage', props.email);
    const storedTasksPerPage = localStorage.getItem(hashedKey);
    if (storedTasksPerPage) {
      setTasksPerPage(parseInt(storedTasksPerPage, 10));
    }
  }, [props.email]);
  useEffect(() => {
    if (_selectedTask) {
      setEditedTags(_selectedTask.tags || []);
    }
  }, [_selectedTask]);

  useEffect(() => {
    const hashedKey = hashKey('lastSyncTime', props.email);
    const storedLastSyncTime = localStorage.getItem(hashedKey);
    if (storedLastSyncTime) {
      setLastSyncTime(parseInt(storedLastSyncTime, 10));
    }
  }, [props.email]);

  // Update the displayed time every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSyncTime((prevTime) => prevTime);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Listen for sync events from WebSocket handler
  useEffect(() => {
    const handleSyncTasks = () => {
      syncTasksWithTwAndDb();
    };

    window.addEventListener('syncTasks', handleSyncTasks);
    return () => window.removeEventListener('syncTasks', handleSyncTasks);
  }, [syncTasksWithTwAndDb]);

  useEffect(() => {
    const fetchTasksForEmail = async () => {
      try {
        const tasksFromDB = await db.tasks
          .where('email')
          .equals(props.email)
          .toArray();

        // Set all tasks
        setTasks(sortTasksById(tasksFromDB, 'desc'));
        setTempTasks(sortTasksById(tasksFromDB, 'desc'));

        const projectsSet = new Set(tasksFromDB.map((task) => task.project));
        const filteredProjects = Array.from(projectsSet)
          .filter((project) => project !== '')
          .sort((a, b) => (a > b ? 1 : -1));
        setUniqueProjects(filteredProjects);

        //  Extract unique tags
        const tagsSet = new Set(tasksFromDB.flatMap((task) => task.tags || []));
        const filteredTags = Array.from(tagsSet)
          .filter((tag) => tag !== '')
          .sort((a, b) => (a > b ? 1 : -1));
        setUniqueTags(filteredTags);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasksForEmail();
  }, [props.email]);

  useEffect(() => {
    if (!isAddTaskOpen) {
      setIsCreatingNewProject(false);
    }
  }, [isAddTaskOpen]);

  syncTasksWithTwAndDb = useCallback(async () => {
    try {
      const { email: user_email, encryptionSecret, UUID } = props;
      const taskwarriorTasks = await fetchTaskwarriorTasks({
        email: user_email,
        encryptionSecret,
        UUID,
        backendURL: url.backendURL,
      });
      console.log(taskwarriorTasks);

      await db.transaction('rw', db.tasks, async () => {
        await db.tasks.where('email').equals(user_email).delete();
        const tasksToAdd = taskwarriorTasks.map((task: Task) => ({
          ...task,
          email: user_email,
        }));
        await db.tasks.bulkPut(tasksToAdd);
        const updatedTasks = await db.tasks
          .where('email')
          .equals(user_email)
          .toArray();
        const sortedTasks = sortTasksById(updatedTasks, 'desc');
        setTasks(sortedTasks);
        setTempTasks(sortedTasks);

        // Update unique projects after a successful sync so the Project dropdown is populated
        const projectsSet = new Set(sortedTasks.map((task) => task.project));
        const filteredProjects = Array.from(projectsSet)
          .filter((project) => project !== '')
          .sort((a, b) => (a > b ? 1 : -1));
        setUniqueProjects(filteredProjects);
      });

      // Store last sync timestamp using hashed key
      const currentTime = Date.now();
      const hashedKey = hashKey('lastSyncTime', user_email);
      localStorage.setItem(hashedKey, currentTime.toString());
      setLastSyncTime(currentTime);

      setUnsyncedTaskUuids(new Set());

      toast.success(`Tasks synced successfully!`);
    } catch (error) {
      console.error('Error syncing tasks:', error);
      toast.error(`Failed to sync tasks. Please try again.`);
    } finally {
      props.setIsLoading(false);
    }
  }, [props.email, props.encryptionSecret, props.UUID]); // Add dependencies

  async function handleAddTask(task: TaskFormData) {
    try {
      await addTaskToBackend({
        email: props.email,
        encryptionSecret: props.encryptionSecret,
        UUID: props.UUID,
        description: task.description,
        project: task.project,
        priority: task.priority,
        due: task.due || undefined,
        start: task.start || '',
        entry: task.entry,
        wait: task.wait,
        end: task.end || '',
        recur: task.recur || '',
        tags: task.tags,
        annotations: task.annotations,
        depends: task.depends,
        backendURL: url.backendURL,
      });

      console.log('Task added successfully!');
      setNewTask({
        description: '',
        priority: '',
        project: '',
        due: '',
        start: '',
        entry: '',
        wait: '',
        end: '',
        recur: '',
        tags: [],
        annotations: [],
        depends: [],
      });
      setIsAddTaskOpen(false);
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  }

  async function handleEditTaskOnBackend(
    email: string,
    encryptionSecret: string,
    UUID: string,
    description: string,
    tags: string[],
    taskID: string,
    project: string,
    start: string,
    entry: string,
    wait: string,
    end: string,
    depends: string[],
    due: string,
    recur: string,
    annotations: Annotation[]
  ) {
    try {
      await editTaskOnBackend({
        email,
        encryptionSecret,
        UUID,
        description,
        tags,
        taskID,
        backendURL: url.backendURL,
        project,
        start,
        entry,
        wait,
        end,
        depends,
        due,
        recur,
        annotations,
      });

      // Don't show success message here - wait for WebSocket confirmation
      setIsAddTaskOpen(false);
    } catch (error) {
      console.error('Failed to edit task:', error);
    }
  }

  const handleBulkComplete = async () => {
    if (selectedTaskUUIDs.length === 0) return;

    setUnsyncedTaskUuids((prev) => new Set([...prev, ...selectedTaskUUIDs]));

    const success = await bulkMarkTasksAsCompleted(
      props.email,
      props.encryptionSecret,
      props.UUID,
      selectedTaskUUIDs
    );

    if (success) {
      setSelectedTaskUUIDs([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskUUIDs.length === 0) return;

    setUnsyncedTaskUuids((prev) => new Set([...prev, ...selectedTaskUUIDs]));

    const success = await bulkMarkTasksAsDeleted(
      props.email,
      props.encryptionSecret,
      props.UUID,
      selectedTaskUUIDs
    );

    if (success) {
      setSelectedTaskUUIDs([]);
    }
  };

  const handleIdSort = () => {
    const newOrder = idSortOrder === 'asc' ? 'desc' : 'asc';
    setIdSortOrder(newOrder);
    const sorted = sortTasksById([...tasks], newOrder);
    setTasks(sorted);
    setTempTasks(sorted);
    setCurrentPage(1);
  };

  const handleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    const sorted = sortTasks([...tasks], newOrder);
    setTasks(sorted);
    setTempTasks(sorted);
    setCurrentPage(1);
  };

  const handleMarkComplete = async (taskuuid: string) => {
    // Find the task being completed
    const taskToComplete = tasks.find((t) => t.uuid === taskuuid);
    if (!taskToComplete) {
      toast.error('Task not found');
      return;
    }

    if (taskToComplete.depends && taskToComplete.depends.length > 0) {
      const incompleteDependencies = taskToComplete.depends.filter(
        (depUuid) => {
          const depTask = tasks.find((t) => t.uuid === depUuid);
          return depTask && depTask.status !== 'completed';
        }
      );

      if (incompleteDependencies.length > 0) {
        const incompleteDepNames = incompleteDependencies
          .map((depUuid) => {
            const depTask = tasks.find((t) => t.uuid === depUuid);
            return depTask?.description || depUuid.substring(0, 8);
          })
          .join(', ');
        toast.error(
          `Cannot complete this task. Please complete these dependencies first: ${incompleteDepNames}`
        );
        return;
      }
    }

    // If all dependencies are completed, allow completion
    setUnsyncedTaskUuids((prev) => new Set([...prev, taskuuid]));

    await markTaskAsCompleted(
      props.email,
      props.encryptionSecret,
      props.UUID,
      taskuuid
    );
  };

  const handleMarkDelete = async (taskuuid: string) => {
    setUnsyncedTaskUuids((prev) => new Set([...prev, taskuuid]));

    await markTaskAsDeleted(
      props.email,
      props.encryptionSecret,
      props.UUID,
      taskuuid
    );
  };

  const handleSelectTask = (task: Task, index: number) => {
    setSelectedTask(task);
    setSelectedIndex(index);
    resetEditState(); // as before
  };

  const handleSaveDescription = (task: Task, description: string) => {
    task.description = description;

    setUnsyncedTaskUuids((prev) => new Set([...prev, task.uuid]));

    handleEditTaskOnBackend(
      props.email,
      props.encryptionSecret,
      props.UUID,
      task.description,
      task.tags,
      task.id.toString(),
      task.project,
      task.start,
      task.entry || '',
      task.wait || '',
      task.end || '',
      task.depends || [],
      task.due || '',
      task.recur || '',
      task.annotations || []
    );
  };

  const handleProjectSaveClick = (task: Task, project: string) => {
    task.project = project;

    setUnsyncedTaskUuids((prev) => new Set([...prev, task.uuid]));

    handleEditTaskOnBackend(
      props.email,
      props.encryptionSecret,
      props.UUID,
      task.description,
      task.tags,
      task.id.toString(),
      task.project,
      task.start,
      task.entry || '',
      task.wait || '',
      task.end || '',
      task.depends || [],
      task.due || '',
      task.recur || '',
      task.annotations || []
    );
  };

  const handleWaitDateSaveClick = (task: Task, waitDate: string) => {
    task.wait = waitDate;

    setUnsyncedTaskUuids((prev) => new Set([...prev, task.uuid]));

    handleEditTaskOnBackend(
      props.email,
      props.encryptionSecret,
      props.UUID,
      task.description,
      task.tags,
      task.id.toString(),
      task.project,
      task.start,
      task.entry || '',
      task.wait,
      task.end || '',
      task.depends || [],
      task.due || '',
      task.recur || '',
      task.annotations || []
    );
  };

  const handleStartDateSaveClick = (task: Task, startDate: string) => {
    task.start = startDate;

    setUnsyncedTaskUuids((prev) => new Set([...prev, task.uuid]));

    handleEditTaskOnBackend(
      props.email,
      props.encryptionSecret,
      props.UUID,
      task.description,
      task.tags,
      task.id.toString(),
      task.project,
      task.start,
      task.entry || '',
      task.wait || '',
      task.end || '',
      task.depends || [],
      task.due || '',
      task.recur || '',
      task.annotations || []
    );
  };

  const handleEntryDateSaveClick = (task: Task, entryDate: string) => {
    task.entry = entryDate;

    setUnsyncedTaskUuids((prev) => new Set([...prev, task.uuid]));

    handleEditTaskOnBackend(
      props.email,
      props.encryptionSecret,
      props.UUID,
      task.description,
      task.tags,
      task.id.toString(),
      task.project,
      task.start,
      task.entry,
      task.wait,
      task.end,
      task.depends || [],
      task.due || '',
      task.recur || '',
      task.annotations || []
    );
  };

  const handleEndDateSaveClick = (task: Task, endDate: string) => {
    task.end = endDate;

    setUnsyncedTaskUuids((prev) => new Set([...prev, task.uuid]));

    handleEditTaskOnBackend(
      props.email,
      props.encryptionSecret,
      props.UUID,
      task.description,
      task.tags,
      task.id.toString(),
      task.project,
      task.start,
      task.entry,
      task.wait,
      task.end,
      task.depends || [],
      task.due || '',
      task.recur || '',
      task.annotations || []
    );
  };

  const handleDueDateSaveClick = (task: Task, dueDate: string) => {
    task.due = dueDate;

    setUnsyncedTaskUuids((prev) => new Set([...prev, task.uuid]));

    handleEditTaskOnBackend(
      props.email,
      props.encryptionSecret,
      props.UUID,
      task.description,
      task.tags,
      task.id.toString(),
      task.project,
      task.start,
      task.entry,
      task.wait,
      task.end,
      task.depends || [],
      task.due,
      task.recur || '',
      task.annotations || []
    );
  };

  const handleDependsSaveClick = async (task: Task, depends: string[]) => {
    setUnsyncedTaskUuids((prev) => new Set([...prev, task.uuid]));

    try {
      console.log('Calling backend...');
      await handleEditTaskOnBackend(
        props.email,
        props.encryptionSecret,
        props.UUID,
        task.description,
        task.tags,
        task.id.toString(),
        task.project,
        task.start,
        task.entry || '',
        task.wait || '',
        task.end || '',
        depends,
        task.due || '',
        task.recur || '',
        task.annotations || []
      );
    } catch (error) {
      console.error('Failed to update dependencies:', error);
    }
  };

  const handleRecurSaveClick = (task: Task, recur: string) => {
    if (editState.editedRecur === 'none') {
      updateEditState({ isEditingRecur: false });
      return;
    }

    if (!editState.editedRecur || editState.editedRecur === '') {
      updateEditState({ isEditingRecur: false });
      return;
    }

    task.recur = recur;

    setUnsyncedTaskUuids((prev) => new Set([...prev, task.uuid]));

    handleEditTaskOnBackend(
      props.email,
      props.encryptionSecret,
      props.UUID,
      task.description,
      task.tags,
      task.id.toString(),
      task.project,
      task.start,
      task.entry || '',
      task.wait || '',
      task.end || '',
      task.depends || [],
      task.due || '',
      task.recur,
      task.annotations || []
    );
  };

  const handleDialogOpenChange = (isOpen: boolean, task?: Task) => {
    setIsDialogOpen(isOpen);
    if (!isOpen) {
      resetEditState();
      setSelectedTask(null);
    } else if (task) {
      setSelectedTask(task);
    }
  };

  const sortWithOverdueOnTop = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      const aOverdue = a.status === 'pending' && isOverdue(a.due);
      const bOverdue = b.status === 'pending' && isOverdue(b.due);

      // Overdue always on top
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // Otherwise fall back to ID sort and status sort
      return 0;
    });
  };

  useEffect(() => {
    let filteredTasks = [...tasks];

    // Project filter
    if (selectedProjects.length > 0) {
      filteredTasks = filteredTasks.filter(
        (task) => task.project && selectedProjects.includes(task.project)
      );
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      filteredTasks = filteredTasks.filter((task) => {
        const isTaskOverdue = task.status === 'pending' && isOverdue(task.due);

        if (selectedStatuses.includes('overdue') && isTaskOverdue) {
          return true;
        }

        return selectedStatuses.includes(task.status);
      });
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.tags && task.tags.some((tag) => selectedTags.includes(tag))
      );
    }

    // Fuzzy search
    if (debouncedTerm.trim() !== '') {
      const fuseOptions = {
        keys: ['description', 'project', 'tags'],
        threshold: 0.4,
        ignoreLocation: true,
        includeScore: false,
      };

      const fuse = new Fuse(filteredTasks, fuseOptions);
      const results = fuse.search(debouncedTerm);

      filteredTasks = results.map((r) => r.item);
    }

    filteredTasks = sortWithOverdueOnTop(filteredTasks);
    setTempTasks(filteredTasks);
  }, [selectedProjects, selectedTags, selectedStatuses, tasks, debouncedTerm]);

  const handleSaveTags = (task: Task, tags: string[]) => {
    const currentTags = tags || [];
    const removedTags = currentTags.filter((tag) => !editedTags.includes(tag));
    const updatedTags = editedTags.filter((tag) => tag.trim() !== '');
    const tagsToRemove = removedTags.map((tag) => `${tag}`);
    const finalTags = [...updatedTags, ...tagsToRemove];
    console.log(finalTags);

    setUnsyncedTaskUuids((prev) => new Set([...prev, task.uuid]));

    handleEditTaskOnBackend(
      props.email,
      props.encryptionSecret,
      props.UUID,
      task.description,
      finalTags,
      task.id.toString(),
      task.project,
      task.start,
      task.entry || '',
      task.wait || '',
      task.end || '',
      task.depends || [],
      task.due || '',
      task.recur || '',
      task.annotations || []
    );
  };

  const handleSaveAnnotations = (task: Task, annotations: Annotation[]) => {
    task.annotations = annotations;
    handleEditTaskOnBackend(
      props.email,
      props.encryptionSecret,
      props.UUID,
      task.description,
      task.tags,
      task.id.toString(),
      task.project,
      task.start,
      task.entry || '',
      task.wait || '',
      task.end || '',
      task.depends || [],
      task.due || '',
      task.recur || '',
      task.annotations
    );
  };

  const handleSavePriority = async (task: Task, priority: string) => {
    try {
      const priorityValue = priority === 'NONE' ? '' : priority;

      setUnsyncedTaskUuids((prev) => new Set([...prev, task.uuid]));

      await modifyTaskOnBackend({
        email: props.email,
        encryptionSecret: props.encryptionSecret,
        UUID: props.UUID,
        taskID: task.id.toString(),
        description: task.description,
        project: task.project || '',
        priority: priorityValue,
        status: task.status,
        due: task.due || '',
        tags: task.tags || [],
        backendURL: url.backendURL,
      });

      console.log('Priority updated successfully!');
      toast.success('Priority updated successfully!');
    } catch (error) {
      console.error('Failed to update priority:', error);
      toast.error('Failed to update priority. Please try again.');
    }
  };

  useHotkeys(['f'], () => {
    if (!showReports) {
      document.getElementById('search')?.focus();
    }
  });
  useHotkeys(['a'], () => {
    if (!showReports) {
      document.getElementById('add-new-task')?.click();
    }
  });
  useHotkeys(['r'], () => {
    if (!showReports) {
      document.getElementById('sync-task')?.click();
    }
  });
  useHotkeys(['p'], () => {
    if (!showReports) {
      document.getElementById('projects')?.click();
    }
  });
  useHotkeys(['s'], () => {
    if (!showReports) {
      document.getElementById('status')?.click();
    }
  });
  useHotkeys(['t'], () => {
    if (!showReports) {
      document.getElementById('tags')?.click();
    }
  });
  useHotkeys(['c'], () => {
    if (!showReports && !_isDialogOpen) {
      const task = currentTasks[selectedIndex];
      if (!task) return;
      // Step 1
      const openBtn = document.getElementById(`task-row-${task.id}`);
      openBtn?.click();
      // Step 2
      setTimeout(() => {
        const confirmBtn = document.getElementById(
          `mark-task-complete-${task.id}`
        );
        confirmBtn?.click();
      }, 200);
    } else {
      if (_isDialogOpen) {
        const task = currentTasks[selectedIndex];
        if (!task) return;
        const confirmBtn = document.getElementById(
          `mark-task-complete-${task.id}`
        );
        confirmBtn?.click();
      }
    }
  });

  useHotkeys(['d'], () => {
    if (!showReports && !_isDialogOpen) {
      const task = currentTasks[selectedIndex];
      if (!task) return;
      // Step 1
      const openBtn = document.getElementById(`task-row-${task.id}`);
      openBtn?.click();
      // Step 2
      setTimeout(() => {
        const confirmBtn = document.getElementById(
          `mark-task-as-deleted-${task.id}`
        );
        confirmBtn?.click();
      }, 200);
    } else {
      if (_isDialogOpen) {
        const task = currentTasks[selectedIndex];
        if (!task) return;
        const confirmBtn = document.getElementById(
          `mark-task-as-deleted-${task.id}`
        );
        confirmBtn?.click();
      }
    }
  });

  return (
    <section
      id="tasks"
      className="container py-24 pl-1 pr-1 md:pr-4 md:pl-4 sm:py-32"
    >
      <BottomBar
        projects={uniqueProjects}
        selectedProjects={selectedProjects}
        setSelectedProject={setSelectedProjects}
        status={['pending', 'completed', 'deleted']}
        selectedStatuses={selectedStatuses}
        setSelectedStatus={setSelectedStatuses}
        selectedTags={selectedTags}
        tags={uniqueTags}
        setSelectedTag={setSelectedTags}
      />

      <h2
        data-testid="tasks"
        className="text-3xl md:text-4xl font-bold text-center"
      >
        <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
          Tasks
        </span>
      </h2>
      <div className="flex justify-center md:justify-end w-full px-4 mb-4 mt-4">
        <Button variant="outline" onClick={() => setShowReports(!showReports)}>
          {showReports ? 'Show Tasks' : 'Show Reports'}
        </Button>
        {/* Mobile-only Sync button (desktop already shows a Sync button with filters) */}
        <Button
          className="sm:hidden ml-2 relative"
          variant="outline"
          onClick={async () => {
            props.setIsLoading(true);
            await syncTasksWithTwAndDb();
            props.setIsLoading(false);
          }}
          disabled={props.isLoading}
        >
          {props.isLoading ? (
            <Loader2 className="mx-1 size-5 animate-spin" />
          ) : (
            <div className="flex items-center">
              Sync
              {unsyncedTaskUuids.size > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold shadow-sm">
                  {unsyncedTaskUuids.size}
                </span>
              )}
            </div>
          )}
        </Button>
      </div>
      {showReports ? (
        <ReportsView tasks={tasks} />
      ) : (
        <div
          ref={tableRef}
          onMouseEnter={() => setHotkeysEnabled(true)}
          onMouseLeave={() => setHotkeysEnabled(false)}
        >
          {tasks.length != 0 ? (
            <>
              <div className="mt-10 pl-1 md:pl-4 pr-1 md:pr-4 bg-muted/50 border shadow-md rounded-lg p-4 h-full pt-12 pb-6 relative overflow-y-auto">
                {/* Table for displaying tasks */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h3 className="ml-4 mb-4 mr-4 text-2xl mt-0 md:text-2xl font-bold">
                    <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                      Here are{' '}
                    </span>
                    your tasks
                  </h3>
                  <div className="sm:flex flex-row w-full items-center gap-2 md:gap-4">
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="flex-1 min-w-[150px]"
                      data-testid="task-search-bar"
                      icon={<Key lable="f" />}
                    />
                    <MultiSelectFilter
                      id="projects"
                      title="Projects"
                      options={uniqueProjects}
                      selectedValues={selectedProjects}
                      onSelectionChange={setSelectedProjects}
                      className="hidden lg:flex min-w-[140px]"
                      icon={<Key lable="p" />}
                    />
                    <MultiSelectFilter
                      id="status"
                      title="Status"
                      options={status}
                      selectedValues={selectedStatuses}
                      onSelectionChange={setSelectedStatuses}
                      className="hidden lg:flex min-w-[140px]"
                      icon={<Key lable="s" />}
                    />
                    <MultiSelectFilter
                      id="tags"
                      title="Tags"
                      options={uniqueTags}
                      selectedValues={selectedTags}
                      onSelectionChange={setSelectedTags}
                      className="hidden lg:flex min-w-[140px]"
                      icon={<Key lable="t" />}
                    />
                    <div className="flex justify-center">
                      <AddTaskdialog
                        isOpen={isAddTaskOpen}
                        setIsOpen={setIsAddTaskOpen}
                        newTask={newTask}
                        setNewTask={setNewTask}
                        tagInput={tagInput}
                        setTagInput={setTagInput}
                        onSubmit={handleAddTask}
                        isCreatingNewProject={isCreatingNewProject}
                        setIsCreatingNewProject={setIsCreatingNewProject}
                        uniqueProjects={uniqueProjects}
                        allTasks={tasks}
                      />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        id="sync-task"
                        variant="outline"
                        className="relative"
                        onClick={async () => {
                          props.setIsLoading(true);
                          await syncTasksWithTwAndDb();
                          props.setIsLoading(false);
                        }}
                      >
                        Sync
                        <Key lable="r" />
                        {unsyncedTaskUuids.size > 0 && (
                          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold shadow-sm">
                            {unsyncedTaskUuids.size}
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground ml-4">
                  {getTimeSinceLastSync(lastSyncTime)}
                </span>
                <div className="overflow-x-auto">
                  <Table className="w-full text-white">
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <input
                            type="checkbox"
                            checked={
                              currentTasks.filter((t) => t.status !== 'deleted')
                                .length > 0 &&
                              selectedTaskUUIDs.length ===
                                currentTasks.filter(
                                  (t) => t.status !== 'deleted'
                                ).length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTaskUUIDs(
                                  currentTasks
                                    .filter((task) => task.status !== 'deleted')
                                    .map((task) => task.uuid)
                                );
                              } else {
                                setSelectedTaskUUIDs([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead
                          className="py-2 w-0.20/6"
                          onClick={handleIdSort}
                          style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          ID{' '}
                          {idSortOrder === 'asc' ? (
                            <ArrowUpDown className="ml-0.5 h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="ml-0.5 h-4 w-4 transform rotate-180" />
                          )}
                        </TableHead>
                        <TableHead className="py-2 w-5/6">
                          Description
                        </TableHead>
                        <TableHead
                          className="py-2 w-0.20/6"
                          onClick={handleSort}
                          style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          Status <ArrowUpDown className="ml-0.5 h-4 w-4" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Display tasks */}
                      {props.isLoading ? (
                        <Taskskeleton count={tasksPerPage} />
                      ) : (
                        currentTasks.map((task: Task, index: number) => (
                          <TaskDialog
                            key={task.uuid}
                            index={index}
                            selectedTaskUUIDs={selectedTaskUUIDs}
                            onCheckboxChange={(
                              uuid: string,
                              checked: boolean
                            ) => {
                              if (checked) {
                                setSelectedTaskUUIDs([
                                  ...selectedTaskUUIDs,
                                  uuid,
                                ]);
                              } else {
                                setSelectedTaskUUIDs(
                                  selectedTaskUUIDs.filter((id) => id !== uuid)
                                );
                              }
                            }}
                            onSelectTask={handleSelectTask}
                            selectedIndex={selectedIndex}
                            task={task}
                            isOpen={
                              _isDialogOpen && _selectedTask?.uuid === task.uuid
                            }
                            onOpenChange={handleDialogOpenChange}
                            editState={editState}
                            onUpdateState={updateEditState}
                            allTasks={tasks}
                            uniqueProjects={uniqueProjects}
                            isCreatingNewProject={isCreatingNewProject}
                            setIsCreatingNewProject={setIsCreatingNewProject}
                            onSaveDescription={handleSaveDescription}
                            onSaveTags={handleSaveTags}
                            onSavePriority={handleSavePriority}
                            onSaveProject={handleProjectSaveClick}
                            onSaveWaitDate={handleWaitDateSaveClick}
                            onSaveStartDate={handleStartDateSaveClick}
                            onSaveEntryDate={handleEntryDateSaveClick}
                            onSaveEndDate={handleEndDateSaveClick}
                            onSaveDueDate={handleDueDateSaveClick}
                            onSaveDepends={handleDependsSaveClick}
                            onSaveRecur={handleRecurSaveClick}
                            onSaveAnnotations={handleSaveAnnotations}
                            onMarkComplete={handleMarkComplete}
                            onMarkDeleted={handleMarkDelete}
                            isOverdue={isOverdue}
                            isUnsynced={unsyncedTaskUuids.has(task.uuid)}
                          />
                        ))
                      )}

                      {/* Display empty rows */}
                      {!props.isLoading && emptyRows > 0 && (
                        <TableRow style={{ height: 52 * emptyRows }}>
                          <TableCell colSpan={6} />
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-baseline mt-4">
                  <div className="flex-1 flex justify-start">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="tasks-per-page"
                        className="text-sm text-muted-foreground flex-shrink-0"
                      >
                        Show:
                      </Label>
                      <select
                        id="tasks-per-page"
                        value={tasksPerPage}
                        onChange={(e) =>
                          handleTasksPerPageChange(parseInt(e.target.value, 10))
                        }
                        className="border border[1px] rounded-md px-2 py-1 bg-white dark:bg-black text-black dark:text-white h-10 text-sm"
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </select>
                    </div>
                  </div>

                  {/* Pagination */}
                  <div className="flex-1 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      paginate={paginate}
                      getDisplayedPages={getDisplayedPages}
                    />
                  </div>
                  <div className="flex-1">
                    {/* Intentionally empty for spacing */}
                  </div>
                </div>
                {selectedTaskUUIDs.length > 0 && (
                  <div
                    className="sticky bottom-0 left-1/2 -translate-x-1/2 w-fit bg-black border border-white rounded-lg shadow-xl p-1.5 mt-4 flex gap-4 z-50"
                    data-testid="bulk-action-bar"
                  >
                    {/* Bulk Complete Dialog */}
                    {!selectedTaskUUIDs.some((uuid) => {
                      const task = currentTasks.find((t) => t.uuid === uuid);
                      return task?.status === 'completed';
                    }) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="default"
                            data-testid="bulk-complete-btn"
                          >
                            Mark {selectedTaskUUIDs.length}{' '}
                            {selectedTaskUUIDs.length === 1 ? 'Task' : 'Tasks'}{' '}
                            Completed
                          </Button>
                        </DialogTrigger>

                        <DialogContent>
                          <DialogTitle className="text-2xl font-bold">
                            <span className="bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
                              Are you
                            </span>{' '}
                            sure?
                          </DialogTitle>

                          <DialogFooter className="flex flex-row justify-center">
                            <DialogClose asChild>
                              <Button
                                className="mr-5"
                                onClick={async () => {
                                  await handleBulkComplete();
                                }}
                              >
                                Yes
                              </Button>
                            </DialogClose>

                            <DialogClose asChild>
                              <Button variant="destructive">No</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Bulk Delete Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          data-testid="bulk-delete-btn"
                        >
                          Delete {selectedTaskUUIDs.length}{' '}
                          {selectedTaskUUIDs.length === 1 ? 'Task' : 'Tasks'}
                        </Button>
                      </DialogTrigger>

                      <DialogContent>
                        <DialogTitle className="text-2xl font-bold">
                          <span className="bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
                            Are you
                          </span>{' '}
                          sure?
                        </DialogTitle>

                        <DialogFooter className="flex flex-row justify-center">
                          <DialogClose asChild>
                            <Button
                              className="mr-5"
                              onClick={async () => {
                                await handleBulkDelete();
                              }}
                            >
                              Yes
                            </Button>
                          </DialogClose>

                          <DialogClose asChild>
                            <Button variant="destructive">No</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mt-10 pl-1 md:pl-4 pr-1 md:pr-4 bg-muted/50 border shadow-md rounded-lg p-4 h-full pt-12 pb-6">
                <div className="flex items-center justify-between">
                  <h3 className="ml-4 mb-4 mr-4 text-2xl mt-0 md:text-2xl font-bold">
                    <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                      No tasks{' '}
                    </span>
                    found
                  </h3>
                  <div className="flex items-center justify-left">
                    <div className="pr-2">
                      <AddTaskdialog
                        isOpen={isAddTaskOpen}
                        setIsOpen={setIsAddTaskOpen}
                        newTask={newTask}
                        setNewTask={setNewTask}
                        tagInput={tagInput}
                        setTagInput={setTagInput}
                        onSubmit={handleAddTask}
                        isCreatingNewProject={isCreatingNewProject}
                        setIsCreatingNewProject={setIsCreatingNewProject}
                        uniqueProjects={uniqueProjects}
                        allTasks={tasks}
                      />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          props.setIsLoading(true);
                          await syncTasksWithTwAndDb();
                          props.setIsLoading(false);
                        }}
                        disabled={props.isLoading}
                      >
                        {props.isLoading ? (
                          <Loader2 className="mx-1 size-5 animate-spin" />
                        ) : (
                          'Sync'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground ml-4">
                  {getTimeSinceLastSync(lastSyncTime)}
                </span>
                <div className="text-l ml-5 text-muted-foreground mt-5 mb-5">
                  Add a new task or sync tasks from taskwarrior to view tasks.
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};
