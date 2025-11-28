import { useEffect, useState, useCallback, useRef } from 'react';
import { Task } from '../../utils/types';
import { ReportsView } from './ReportsView';
import Fuse from 'fuse.js';
import { useHotkeys } from '@/components/utils/use-hotkeys';
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import {
  ArrowUpDown,
  CheckIcon,
  CopyIcon,
  Folder,
  Loader2,
  PencilIcon,
  Tag,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CopyToClipboard from 'react-copy-to-clipboard';
import {
  formattedDate,
  getDisplayedPages,
  handleCopy,
  handleDate,
  markTaskAsCompleted,
  markTaskAsDeleted,
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
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { Taskskeleton } from './TaskSkeleton';
import { Key } from '@/components/ui/key-button';

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
  const status = ['pending', 'completed', 'deleted'];
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [idSortOrder, setIdSortOrder] = useState<'asc' | 'desc'>('asc');

  const [newTask, setNewTask] = useState({
    description: '',
    priority: '',
    project: '',
    due: '',
    tags: [] as string[],
  });
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [_isDialogOpen, setIsDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [_selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editedTags, setEditedTags] = useState<string[]>(
    _selectedTask?.tags || []
  );
  const [editTagInput, setEditTagInput] = useState<string>('');
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [editedPriority, setEditedPriority] = useState('NONE');
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedProject, setEditedProject] = useState(
    _selectedTask?.project || ''
  );
  const [isEditingWaitDate, setIsEditingWaitDate] = useState(false);
  const [editedWaitDate, setEditedWaitDate] = useState('');
  const [isEditingStartDate, setIsEditingStartDate] = useState(false);
  const [editedStartDate, setEditedStartDate] = useState('');
  const [isEditingEntryDate, setIsEditingEntryDate] = useState(false);
  const [editedEntryDate, setEditedEntryDate] = useState('');
  const [isEditingEndDate, setIsEditingEndDate] = useState(false);
  const [editedEndDate, setEditedEndDate] = useState('');
  const [isEditingDepends, setIsEditingDepends] = useState(false);
  const [editedDepends, setEditedDepends] = useState<string[]>([]);
  const [dependsDropdownOpen, setDependsDropdownOpen] = useState(false);
  const [dependsSearchTerm, setDependsSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

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
        setTasks(sortTasksById(updatedTasks, 'desc'));
        setTempTasks(sortTasksById(updatedTasks, 'desc'));
      });

      // Store last sync timestamp using hashed key
      const currentTime = Date.now();
      const hashedKey = hashKey('lastSyncTime', user_email);
      localStorage.setItem(hashedKey, currentTime.toString());
      setLastSyncTime(currentTime);

      toast.success(`Tasks synced successfully!`);
    } catch (error) {
      console.error('Error syncing tasks:', error);
      toast.error(`Failed to sync tasks. Please try again.`);
    } finally {
      props.setIsLoading(false);
    }
  }, [props.email, props.encryptionSecret, props.UUID]); // Add dependencies

  async function handleAddTask(
    email: string,
    encryptionSecret: string,
    UUID: string,
    description: string,
    project: string,
    priority: string,
    due: string,
    tags: string[]
  ) {
    if (handleDate(newTask.due)) {
      try {
        await addTaskToBackend({
          email,
          encryptionSecret,
          UUID,
          description,
          project,
          priority,
          due,
          tags,
          backendURL: url.backendURL,
        });

        console.log('Task added successfully!');
        setNewTask({
          description: '',
          priority: '',
          project: '',
          due: '',
          tags: [],
        });
        setIsAddTaskOpen(false);
      } catch (error) {
        console.error('Failed to add task:', error);
      }
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
    depends: string[]
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
      });

      console.log('Task edited successfully!');
      setIsAddTaskOpen(false);
    } catch (error) {
      console.error('Failed to edit task:', error);
    }
  }

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

  const handleEditClick = (description: string) => {
    setIsEditing(true);
    setEditedDescription(description);
  };

  const handleSaveClick = (task: Task) => {
    task.description = editedDescription;
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
      task.depends || []
    );
    setIsEditing(false);
  };

  const handleProjectSaveClick = (task: Task) => {
    task.project = editedProject;
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
      task.depends || []
    );
    setIsEditingProject(false);
  };

  const handleWaitDateSaveClick = (task: Task) => {
    task.wait = editedWaitDate;

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
      task.depends || []
    );

    setIsEditingWaitDate(false);
  };

  const handleStartDateSaveClick = (task: Task) => {
    task.start = editedStartDate;

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
      task.depends || []
    );

    setIsEditingStartDate(false);
  };

  const handleEntryDateSaveClick = (task: Task) => {
    task.entry = editedEntryDate;

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
      task.depends || []
    );

    setIsEditingEntryDate(false);
  };

  const handleEndDateSaveClick = (task: Task) => {
    task.end = editedEndDate;

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
      task.depends || []
    );

    setIsEditingEndDate(false);
  };

  const handleDependsSaveClick = (task: Task) => {
    task.depends = editedDepends;

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
      task.depends
    );

    setIsEditingDepends(false);
    setDependsDropdownOpen(false);
  };

  const handleAddDependency = (uuid: string) => {
    if (!editedDepends.includes(uuid)) {
      setEditedDepends([...editedDepends, uuid]);
    }
  };

  const handleRemoveDependency = (uuid: string) => {
    setEditedDepends(editedDepends.filter((dep) => dep !== uuid));
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleDialogOpenChange = (_isDialogOpen: boolean, task: any) => {
    setIsDialogOpen(_isDialogOpen);
    if (!_isDialogOpen) {
      setIsEditing(false);
      setEditedDescription('');
      setIsEditingTags(false);
      setEditedTags([]);
      setIsEditingPriority(false);
      setEditedPriority('NONE');
      setIsEditingStartDate(false);
      setEditedStartDate('');
      setIsEditingEntryDate(false);
      setEditedEntryDate('');
      setIsEditingEndDate(false);
      setEditedEndDate('');
      setIsEditingDepends(false);
      setEditedDepends([]);
      setDependsDropdownOpen(false);
      setDependsSearchTerm('');
    } else {
      setSelectedTask(task);
      setEditedDescription(task?.description || '');
      setEditedPriority(task?.priority || 'NONE');
    }
  };

  // Handle adding a tag
  const handleAddTag = () => {
    if (tagInput && !newTask.tags.includes(tagInput, 0)) {
      setNewTask({ ...newTask, tags: [...newTask.tags, tagInput] });
      setTagInput(''); // Clear the input field
    }
  };

  // Handle adding a tag while editing
  const handleAddEditTag = () => {
    if (editTagInput && !editedTags.includes(editTagInput, 0)) {
      setEditedTags([...editedTags, editTagInput]);
      setEditTagInput('');
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setNewTask({
      ...newTask,
      tags: newTask.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  // Handle removing a tag while editing task
  const handleRemoveEditTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter((tag) => tag !== tagToRemove));
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
      filteredTasks = filteredTasks.filter((task) =>
        selectedStatuses.includes(task.status)
      );
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

  const handleEditTagsClick = (task: Task) => {
    setEditedTags(task.tags || []);
    setIsEditingTags(true);
  };

  const handleSaveTags = (task: Task) => {
    const currentTags = task.tags || [];
    const removedTags = currentTags.filter((tag) => !editedTags.includes(tag));
    const updatedTags = editedTags.filter((tag) => tag.trim() !== '');
    const tagsToRemove = removedTags.map((tag) => `-${tag}`);
    const finalTags = [...updatedTags, ...tagsToRemove];
    console.log(finalTags);
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
      task.depends || []
    );

    setIsEditingTags(false);
    setEditTagInput('');
  };

  const handleCancelTags = () => {
    setIsEditingTags(false);
    setEditedTags([]);
  };
  const handleEditPriorityClick = (task: Task) => {
    setEditedPriority(task.priority || 'NONE');
    setIsEditingPriority(true);
  };

  const handleSavePriority = async (task: Task) => {
    try {
      const priorityValue = editedPriority === 'NONE' ? '' : editedPriority;

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
      setIsEditingPriority(false);
    } catch (error) {
      console.error('Failed to update priority:', error);
      toast.error('Failed to update priority. Please try again.');
    }
  };

  const handleCancelPriority = () => {
    setIsEditingPriority(false);
    if (_selectedTask) {
      setEditedPriority(_selectedTask.priority || 'NONE');
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
          className="sm:hidden ml-2"
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
              <div className="mt-10 pl-1 md:pl-4 pr-1 md:pr-4 bg-muted/50 border shadow-md rounded-lg p-4 h-full pt-12 pb-6">
                {/* Table for displaying tasks */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h3 className="ml-4 mb-4 mr-4 text-2xl mt-0 md:text-2xl font-bold">
                    <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                      Here are{' '}
                    </span>
                    your tasks
                  </h3>
                  <div className="hidden sm:flex flex-row w-full items-center gap-2 md:gap-4">
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
                      className="flex-1 min-w-[140px]"
                      icon={<Key lable="p" />}
                    />
                    <MultiSelectFilter
                      id="status"
                      title="Status"
                      options={status}
                      selectedValues={selectedStatuses}
                      onSelectionChange={setSelectedStatuses}
                      className="flex-1 min-w-[140px]"
                      icon={<Key lable="s" />}
                    />
                    <MultiSelectFilter
                      id="tags"
                      title="Tags"
                      options={uniqueTags}
                      selectedValues={selectedTags}
                      onSelectionChange={setSelectedTags}
                      className="flex-1 min-w-[140px]"
                      icon={<Key lable="t" />}
                    />
                    <div className="pr-2">
                      <Dialog
                        open={isAddTaskOpen}
                        onOpenChange={setIsAddTaskOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            id="add-new-task"
                            variant="outline"
                            onClick={() => setIsAddTaskOpen(true)}
                          >
                            Add Task
                            <Key lable="a" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                                <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                  Add a{' '}
                                </span>
                                new task
                              </span>
                            </DialogTitle>
                            <DialogDescription>
                              Fill in the details below to add a new task.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label
                                htmlFor="description"
                                className="text-right"
                              >
                                Description
                              </Label>
                              <Input
                                id="description"
                                name="description"
                                type="text"
                                value={newTask.description}
                                onChange={(e) =>
                                  setNewTask({
                                    ...newTask,
                                    description: e.target.value,
                                  })
                                }
                                required
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="priority" className="text-right">
                                Priority
                              </Label>
                              <div className="col-span-1 flex items-center">
                                <select
                                  id="priority"
                                  name="priority"
                                  value={newTask.priority}
                                  onChange={(e) =>
                                    setNewTask({
                                      ...newTask,
                                      priority: e.target.value,
                                    })
                                  }
                                  className="border rounded-md px-2 py-1 w-full bg-white text-black dark:bg-black dark:text-white transition-colors"
                                >
                                  <option value="H">H</option>
                                  <option value="M">M</option>
                                  <option value="L">L</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label
                                htmlFor="description"
                                className="text-right"
                              >
                                Project
                              </Label>
                              <Input
                                id="project"
                                name="project"
                                type=""
                                value={newTask.project}
                                onChange={(e) =>
                                  setNewTask({
                                    ...newTask,
                                    project: e.target.value,
                                  })
                                }
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="due" className="text-right">
                                Due
                              </Label>
                              <div className="col-span-3">
                                <DatePicker
                                  date={
                                    newTask.due
                                      ? new Date(newTask.due)
                                      : undefined
                                  }
                                  onDateChange={(date) => {
                                    setNewTask({
                                      ...newTask,
                                      due: date
                                        ? format(date, 'yyyy-MM-dd')
                                        : '',
                                    });
                                  }}
                                  placeholder="Select a due date"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label
                                htmlFor="description"
                                className="text-right"
                              >
                                Tags
                              </Label>
                              <Input
                                id="tags"
                                name="tags"
                                placeholder="Add a tag"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) =>
                                  e.key === 'Enter' && handleAddTag()
                                } // Allow adding tag on pressing Enter
                                required
                                className="col-span-3"
                              />
                            </div>

                            <div className="mt-2">
                              {newTask.tags.length > 0 && (
                                <div className="grid grid-cols-4 items-center">
                                  <div> </div>
                                  <div className="flex flex-wrap gap-2 col-span-3">
                                    {newTask.tags.map((tag, index) => (
                                      <Badge key={index}>
                                        <span>{tag}</span>
                                        <button
                                          type="button"
                                          className="ml-2 text-red-500"
                                          onClick={() => handleRemoveTag(tag)}
                                        >
                                          ✖
                                        </button>
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="secondary"
                              onClick={() => setIsAddTaskOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              className="mb-1"
                              variant="default"
                              onClick={() =>
                                handleAddTask(
                                  props.email,
                                  props.encryptionSecret,
                                  props.UUID,
                                  newTask.description,
                                  newTask.project,
                                  newTask.priority,
                                  newTask.due,
                                  newTask.tags
                                )
                              }
                            >
                              Add Task
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        id="sync-task"
                        variant="outline"
                        onClick={() => (
                          props.setIsLoading(true),
                          syncTasksWithTwAndDb()
                        )}
                      >
                        Sync
                        <Key lable="r" />
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
                          <Dialog
                            open={
                              _isDialogOpen && _selectedTask?.id === task.id
                            }
                            onOpenChange={(_isDialogOpen) =>
                              handleDialogOpenChange(_isDialogOpen, task)
                            }
                            key={index}
                          >
                            <DialogTrigger asChild>
                              <TableRow
                                id={`task-row-${task.id}`}
                                key={index}
                                className={`border-b cursor-pointer ${selectedIndex === index ? 'bg-muted/50' : ''}`}
                              >
                                {/* Display task details */}
                                <TableCell className="py-2">
                                  <span
                                    className={`px-3 py-1 rounded-md font-semibold ${
                                      task.status === 'pending' &&
                                      isOverdue(task.due)
                                        ? 'bg-red-600/80 text-white'
                                        : ''
                                    }`}
                                  >
                                    {task.id}
                                  </span>
                                </TableCell>
                                <TableCell className="flex items-center space-x-2 py-2">
                                  {task.priority === 'H' && (
                                    <div className="flex items-center justify-center w-3 h-3 bg-red-500 rounded-full border-0 min-w-3"></div>
                                  )}
                                  {task.priority === 'M' && (
                                    <div className="flex items-center justify-center w-3 h-3 bg-yellow-500 rounded-full border-0 min-w-3"></div>
                                  )}
                                  {task.priority != 'H' &&
                                    task.priority != 'M' && (
                                      <div className="flex items-center justify-center w-3 h-3 bg-green-500 rounded-full border-0 min-w-3"></div>
                                    )}
                                  <span className="text-s text-foreground">
                                    {task.description}
                                  </span>
                                  {task.project != '' && (
                                    <Badge variant={'secondary'}>
                                      <Folder className="pr-2" />
                                      {task.project === '' ? '' : task.project}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="py-2">
                                  <Badge
                                    variant={
                                      task.status === 'pending'
                                        ? 'secondary'
                                        : task.status === 'deleted'
                                          ? 'destructive'
                                          : 'default'
                                    }
                                  >
                                    {task.status === 'completed'
                                      ? 'C'
                                      : task.status === 'deleted'
                                        ? 'D'
                                        : 'P'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[625px] max-h-[90vh] flex flex-col">
                              <DialogHeader>
                                <DialogTitle>
                                  <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                                    <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                      Task{' '}
                                    </span>
                                    Details
                                  </span>
                                </DialogTitle>
                              </DialogHeader>

                              {/* Scrollable content */}
                              <div className="overflow-y-auto flex-1">
                                <DialogDescription asChild>
                                  <Table>
                                    <TableBody>
                                      <TableRow>
                                        <TableCell>ID:</TableCell>
                                        <TableCell className="flex items-center gap-3">
                                          {task.id}
                                          {task.status === 'pending' &&
                                            isOverdue(task.due) && (
                                              <Badge className="bg-red-600 text-white shadow-lg shadow-red-700/40 animate-pulse">
                                                Overdue
                                              </Badge>
                                            )}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Description:</TableCell>
                                        <TableCell>
                                          {isEditing ? (
                                            <>
                                              <div className="flex items-center">
                                                <Input
                                                  id={`description-${task.id}`}
                                                  name={`description-${task.id}`}
                                                  type="text"
                                                  value={editedDescription}
                                                  onChange={(e) =>
                                                    setEditedDescription(
                                                      e.target.value
                                                    )
                                                  }
                                                  className="flex-grow mr-2"
                                                />
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() =>
                                                    handleSaveClick(task)
                                                  }
                                                >
                                                  <CheckIcon className="h-4 w-4 text-green-500" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={handleCancelClick}
                                                >
                                                  <XIcon className="h-4 w-4 text-red-500" />
                                                </Button>
                                              </div>
                                            </>
                                          ) : (
                                            <>
                                              <span>{task.description}</span>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  handleEditClick(
                                                    task.description
                                                  )
                                                }
                                              >
                                                <PencilIcon className="h-4 w-4 text-gray-500" />
                                              </Button>
                                            </>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Due:</TableCell>
                                        <TableCell>
                                          {formattedDate(task.due)}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Start:</TableCell>
                                        <TableCell>
                                          {isEditingStartDate ? (
                                            <div className="flex items-center gap-2">
                                              <DatePicker
                                                date={
                                                  editedStartDate &&
                                                  editedStartDate !== ''
                                                    ? (() => {
                                                        try {
                                                          // Handle YYYY-MM-DD format
                                                          const dateStr =
                                                            editedStartDate.includes(
                                                              'T'
                                                            )
                                                              ? editedStartDate.split(
                                                                  'T'
                                                                )[0]
                                                              : editedStartDate;
                                                          const parsed =
                                                            new Date(
                                                              dateStr +
                                                                'T00:00:00'
                                                            );
                                                          return isNaN(
                                                            parsed.getTime()
                                                          )
                                                            ? undefined
                                                            : parsed;
                                                        } catch {
                                                          return undefined;
                                                        }
                                                      })()
                                                    : undefined
                                                }
                                                onDateChange={(date) =>
                                                  setEditedStartDate(
                                                    date
                                                      ? format(
                                                          date,
                                                          'yyyy-MM-dd'
                                                        )
                                                      : ''
                                                  )
                                                }
                                              />

                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  handleStartDateSaveClick(task)
                                                }
                                              >
                                                <CheckIcon className="h-4 w-4 text-green-500" />
                                              </Button>

                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  setIsEditingStartDate(false)
                                                }
                                              >
                                                <XIcon className="h-4 w-4 text-red-500" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <>
                                              <span>
                                                {formattedDate(task.start)}
                                              </span>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                  setIsEditingStartDate(true);
                                                  // Extract just the date part if it's in ISO format
                                                  const startDate = task.start
                                                    ? task.start.includes('T')
                                                      ? task.start.split('T')[0]
                                                      : task.start
                                                    : '';
                                                  setEditedStartDate(startDate);
                                                }}
                                              >
                                                <PencilIcon className="h-4 w-4 text-gray-500" />
                                              </Button>
                                            </>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>End:</TableCell>
                                        <TableCell>
                                          {isEditingEndDate ? (
                                            <div className="flex items-center gap-2">
                                              <DatePicker
                                                date={
                                                  editedEndDate &&
                                                  editedEndDate !== ''
                                                    ? (() => {
                                                        try {
                                                          const dateStr =
                                                            editedEndDate.includes(
                                                              'T'
                                                            )
                                                              ? editedEndDate.split(
                                                                  'T'
                                                                )[0]
                                                              : editedEndDate;
                                                          const parsed =
                                                            new Date(
                                                              dateStr +
                                                                'T00:00:00'
                                                            );
                                                          return isNaN(
                                                            parsed.getTime()
                                                          )
                                                            ? undefined
                                                            : parsed;
                                                        } catch {
                                                          return undefined;
                                                        }
                                                      })()
                                                    : undefined
                                                }
                                                onDateChange={(date) =>
                                                  setEditedEndDate(
                                                    date
                                                      ? format(
                                                          date,
                                                          'yyyy-MM-dd'
                                                        )
                                                      : ''
                                                  )
                                                }
                                                placeholder="Select end date"
                                              />
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  handleEndDateSaveClick(task)
                                                }
                                              >
                                                <CheckIcon className="h-4 w-4 text-green-500" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  setIsEditingEndDate(false)
                                                }
                                              >
                                                <XIcon className="h-4 w-4 text-red-500" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center">
                                              <span>
                                                {formattedDate(task.end)}
                                              </span>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                  setIsEditingEndDate(true);
                                                  const endDate = task.end
                                                    ? task.end.includes('T')
                                                      ? task.end.split('T')[0]
                                                      : task.end
                                                    : '';
                                                  setEditedEndDate(endDate);
                                                }}
                                              >
                                                <PencilIcon className="h-4 w-4 text-gray-500" />
                                              </Button>
                                            </div>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Wait:</TableCell>
                                        <TableCell>
                                          {isEditingWaitDate ? (
                                            <div className="flex items-center gap-2">
                                              <DatePicker
                                                date={
                                                  editedWaitDate
                                                    ? new Date(editedWaitDate)
                                                    : undefined
                                                }
                                                onDateChange={(date) =>
                                                  setEditedWaitDate(
                                                    date
                                                      ? format(
                                                          date,
                                                          'yyyy-MM-dd'
                                                        )
                                                      : ''
                                                  )
                                                }
                                              />

                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  handleWaitDateSaveClick(task)
                                                }
                                              >
                                                <CheckIcon className="h-4 w-4 text-green-500" />
                                              </Button>

                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  setIsEditingWaitDate(false)
                                                }
                                              >
                                                <XIcon className="h-4 w-4 text-red-500" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <>
                                              <span>
                                                {formattedDate(task.wait)}
                                              </span>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                  setIsEditingWaitDate(true);
                                                  setEditedWaitDate(
                                                    task?.wait ?? ''
                                                  );
                                                }}
                                              >
                                                <PencilIcon className="h-4 w-4 text-gray-500" />
                                              </Button>
                                            </>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Depends:</TableCell>
                                        <TableCell>
                                          {!isEditingDepends ? (
                                            <div className="flex flex-wrap items-center gap-2">
                                              {(task.depends || []).map(
                                                (depUuid) => {
                                                  const depTask = tasks.find(
                                                    (t) => t.uuid === depUuid
                                                  );
                                                  return (
                                                    <Badge
                                                      key={depUuid}
                                                      variant="secondary"
                                                      className="cursor-pointer"
                                                      onClick={() => {
                                                        if (depTask) {
                                                          setIsDialogOpen(
                                                            false
                                                          );
                                                          setTimeout(() => {
                                                            setSelectedTask(
                                                              depTask
                                                            );
                                                            setIsDialogOpen(
                                                              true
                                                            );
                                                          }, 100);
                                                        }
                                                      }}
                                                    >
                                                      {depTask?.description ||
                                                        depUuid.substring(0, 8)}
                                                    </Badge>
                                                  );
                                                }
                                              )}
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                  setIsEditingDepends(true);
                                                  setEditedDepends(
                                                    task.depends || []
                                                  );
                                                }}
                                              >
                                                <PencilIcon className="h-4 w-4 text-gray-500" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="space-y-2">
                                              <div className="flex flex-wrap items-center gap-2">
                                                {editedDepends.map(
                                                  (depUuid) => {
                                                    const depTask = tasks.find(
                                                      (t) => t.uuid === depUuid
                                                    );
                                                    return (
                                                      <Badge
                                                        key={depUuid}
                                                        variant="secondary"
                                                      >
                                                        <span>
                                                          {depTask?.description ||
                                                            depUuid.substring(
                                                              0,
                                                              8
                                                            )}
                                                        </span>
                                                        <button
                                                          type="button"
                                                          className="ml-2 text-red-500"
                                                          onClick={() =>
                                                            handleRemoveDependency(
                                                              depUuid
                                                            )
                                                          }
                                                        >
                                                          ✖
                                                        </button>
                                                      </Badge>
                                                    );
                                                  }
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                      setDependsDropdownOpen(
                                                        !dependsDropdownOpen
                                                      )
                                                    }
                                                    className="w-full justify-start"
                                                  >
                                                    <span className="text-lg mr-2">
                                                      +
                                                    </span>
                                                    Add Dependency
                                                  </Button>
                                                  {dependsDropdownOpen && (
                                                    <div className="absolute left-0 top-full mt-1 z-50 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                      <Input
                                                        type="text"
                                                        placeholder="Search tasks..."
                                                        value={
                                                          dependsSearchTerm
                                                        }
                                                        onChange={(e) =>
                                                          setDependsSearchTerm(
                                                            e.target.value
                                                          )
                                                        }
                                                        className="m-2 w-[calc(100%-1rem)]"
                                                      />
                                                      {tasks
                                                        .filter(
                                                          (t) =>
                                                            t.uuid !==
                                                              task.uuid &&
                                                            t.status ===
                                                              'pending' &&
                                                            !editedDepends.includes(
                                                              t.uuid
                                                            ) &&
                                                            t.description
                                                              .toLowerCase()
                                                              .includes(
                                                                dependsSearchTerm.toLowerCase()
                                                              )
                                                        )
                                                        .map((t) => (
                                                          <div
                                                            key={t.uuid}
                                                            className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
                                                            onClick={() => {
                                                              handleAddDependency(
                                                                t.uuid
                                                              );
                                                              setDependsSearchTerm(
                                                                ''
                                                              );
                                                            }}
                                                          >
                                                            <input
                                                              type="checkbox"
                                                              checked={editedDepends.includes(
                                                                t.uuid
                                                              )}
                                                              readOnly
                                                            />
                                                            <span className="text-sm">
                                                              {t.description}
                                                            </span>
                                                          </div>
                                                        ))}
                                                    </div>
                                                  )}
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() =>
                                                    handleDependsSaveClick(task)
                                                  }
                                                >
                                                  <CheckIcon className="h-4 w-4 text-green-500" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => {
                                                    setIsEditingDepends(false);
                                                    setDependsDropdownOpen(
                                                      false
                                                    );
                                                  }}
                                                >
                                                  <XIcon className="h-4 w-4 text-red-500" />
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Recur:</TableCell>
                                        <TableCell>{task.recur}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>RType:</TableCell>
                                        <TableCell>{task.rtype}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Priority:</TableCell>
                                        <TableCell>
                                          {isEditingPriority ? (
                                            <div className="flex items-center">
                                              <Select
                                                value={editedPriority}
                                                onValueChange={
                                                  setEditedPriority
                                                }
                                              >
                                                <SelectTrigger className="flex-grow mr-2">
                                                  <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="NONE">
                                                    None
                                                  </SelectItem>
                                                  <SelectItem value="H">
                                                    High (H)
                                                  </SelectItem>
                                                  <SelectItem value="M">
                                                    Medium (M)
                                                  </SelectItem>
                                                  <SelectItem value="L">
                                                    Low (L)
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  handleSavePriority(task)
                                                }
                                              >
                                                <CheckIcon className="h-4 w-4 text-green-500" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleCancelPriority}
                                              >
                                                <XIcon className="h-4 w-4 text-red-500" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center">
                                              <span>
                                                {task.priority
                                                  ? task.priority === 'H'
                                                    ? 'High (H)'
                                                    : task.priority === 'M'
                                                      ? 'Medium (M)'
                                                      : task.priority === 'L'
                                                        ? 'Low (L)'
                                                        : task.priority
                                                  : 'None'}
                                              </span>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  handleEditPriorityClick(task)
                                                }
                                              >
                                                <PencilIcon className="h-4 w-4 text-gray-500" />
                                              </Button>
                                            </div>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Project:</TableCell>
                                        <TableCell>
                                          {isEditingProject ? (
                                            <>
                                              <div className="flex items-center">
                                                <Input
                                                  id={`project-${task.id}`}
                                                  name={`project-${task.id}`}
                                                  type="text"
                                                  value={editedProject}
                                                  onChange={(e) =>
                                                    setEditedProject(
                                                      e.target.value
                                                    )
                                                  }
                                                  className="flex-grow mr-2"
                                                />
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() =>
                                                    handleProjectSaveClick(task)
                                                  }
                                                >
                                                  <CheckIcon className="h-4 w-4 text-green-500" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() =>
                                                    setIsEditingProject(false)
                                                  }
                                                >
                                                  <XIcon className="h-4 w-4 text-red-500" />
                                                </Button>
                                              </div>
                                            </>
                                          ) : (
                                            <>
                                              <span>{task.project}</span>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                  setIsEditingProject(true);
                                                  setEditedProject(
                                                    task.project
                                                  );
                                                }}
                                              >
                                                <PencilIcon className="h-4 w-4 text-gray-500" />
                                              </Button>
                                            </>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Status:</TableCell>
                                        <TableCell>{task.status}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Tags:</TableCell>
                                        <TableCell>
                                          {isEditingTags ? (
                                            <div>
                                              <div className="flex items-center w-full">
                                                <Input
                                                  type="text"
                                                  value={editTagInput}
                                                  onChange={(e) => {
                                                    // For allowing only alphanumeric characters
                                                    if (
                                                      e.target.value.length > 1
                                                    ) {
                                                      /^[a-zA-Z0-9]*$/.test(
                                                        e.target.value.trim()
                                                      )
                                                        ? setEditTagInput(
                                                            e.target.value.trim()
                                                          )
                                                        : '';
                                                    } else {
                                                      /^[a-zA-Z]*$/.test(
                                                        e.target.value.trim()
                                                      )
                                                        ? setEditTagInput(
                                                            e.target.value.trim()
                                                          )
                                                        : '';
                                                    }
                                                  }}
                                                  placeholder="Add a tag (press enter to add)"
                                                  className="flex-grow mr-2"
                                                  onKeyDown={(e) =>
                                                    e.key === 'Enter' &&
                                                    handleAddEditTag()
                                                  }
                                                />
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() =>
                                                    handleSaveTags(task)
                                                  }
                                                  aria-label="Save tags"
                                                >
                                                  <CheckIcon className="h-4 w-4 text-green-500" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={handleCancelTags}
                                                  aria-label="Cancel editing tags"
                                                >
                                                  <XIcon className="h-4 w-4 text-red-500" />
                                                </Button>
                                              </div>
                                              <div className="mt-2">
                                                {editedTags != null &&
                                                  editedTags.length > 0 && (
                                                    <div>
                                                      <div className="flex flex-wrap gap-2 col-span-3">
                                                        {editedTags.map(
                                                          (tag, index) => (
                                                            <Badge key={index}>
                                                              <span>{tag}</span>
                                                              <button
                                                                type="button"
                                                                className="ml-2 text-red-500"
                                                                onClick={() =>
                                                                  handleRemoveEditTag(
                                                                    tag
                                                                  )
                                                                }
                                                              >
                                                                ✖
                                                              </button>
                                                            </Badge>
                                                          )
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex items-center flex-wrap">
                                              {task.tags !== null &&
                                              task.tags.length >= 1 ? (
                                                task.tags.map((tag, index) => (
                                                  <Badge
                                                    key={index}
                                                    variant="secondary"
                                                    className="mr-2 mt-1"
                                                  >
                                                    <Tag className="pr-3" />
                                                    {tag}
                                                  </Badge>
                                                ))
                                              ) : (
                                                <span>No Tags</span>
                                              )}
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  handleEditTagsClick(task)
                                                }
                                              >
                                                <PencilIcon className="h-4 w-4 text-gray-500" />
                                              </Button>
                                            </div>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Entry:</TableCell>
                                        <TableCell>
                                          {isEditingEntryDate ? (
                                            <div className="flex items-center gap-2">
                                              <DatePicker
                                                date={
                                                  editedEntryDate &&
                                                  editedEntryDate !== ''
                                                    ? (() => {
                                                        try {
                                                          // Handle YYYY-MM-DD format
                                                          const dateStr =
                                                            editedEntryDate.includes(
                                                              'T'
                                                            )
                                                              ? editedEntryDate.split(
                                                                  'T'
                                                                )[0]
                                                              : editedEntryDate;
                                                          const parsed =
                                                            new Date(
                                                              dateStr +
                                                                'T00:00:00'
                                                            );
                                                          return isNaN(
                                                            parsed.getTime()
                                                          )
                                                            ? undefined
                                                            : parsed;
                                                        } catch {
                                                          return undefined;
                                                        }
                                                      })()
                                                    : undefined
                                                }
                                                onDateChange={(date) =>
                                                  setEditedEntryDate(
                                                    date
                                                      ? format(
                                                          date,
                                                          'yyyy-MM-dd'
                                                        )
                                                      : ''
                                                  )
                                                }
                                              />

                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  handleEntryDateSaveClick(task)
                                                }
                                              >
                                                <CheckIcon className="h-4 w-4 text-green-500" />
                                              </Button>

                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  setIsEditingEntryDate(false)
                                                }
                                              >
                                                <XIcon className="h-4 w-4 text-red-500" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <>
                                              <span>
                                                {formattedDate(task.entry)}
                                              </span>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                  setIsEditingEntryDate(true);
                                                  const entryDate = task.entry
                                                    ? task.entry.includes('T')
                                                      ? task.entry.split('T')[0]
                                                      : task.entry
                                                    : '';
                                                  setEditedEntryDate(entryDate);
                                                }}
                                              >
                                                <PencilIcon className="h-4 w-4 text-gray-500" />
                                              </Button>
                                            </>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Urgency:</TableCell>
                                        <TableCell>{task.urgency}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>UUID:</TableCell>
                                        <TableCell className="flex items-center">
                                          <span>{task.uuid}</span>
                                          <CopyToClipboard
                                            text={task.uuid}
                                            onCopy={() =>
                                              handleCopy('Task UUID')
                                            }
                                          >
                                            <button className="bg-blue-500 hover:bg-gray-900 text-white font-bold py-2 px-2 rounded ml-2">
                                              <CopyIcon />
                                            </button>
                                          </CopyToClipboard>
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </DialogDescription>
                              </div>

                              {/* Non-scrollable footer */}
                              <DialogFooter className="flex flex-row justify-end pt-4">
                                {task.status == 'pending' ? (
                                  <Dialog>
                                    <DialogTrigger asChild className="mr-5">
                                      <Button
                                        id={`mark-task-complete-${task.id}`}
                                      >
                                        Mark As Completed <Key lable="c" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogTitle>
                                        <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                                          <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                            Are you{' '}
                                          </span>
                                          sure?
                                        </span>
                                      </DialogTitle>
                                      <DialogFooter className="flex flex-row justify-center">
                                        <DialogClose asChild>
                                          <Button
                                            className="mr-5"
                                            onClick={() => {
                                              markTaskAsCompleted(
                                                props.email,
                                                props.encryptionSecret,
                                                props.UUID,
                                                task.uuid
                                              );
                                              setIsDialogOpen(false);
                                            }}
                                          >
                                            Yes
                                          </Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                          <Button variant={'destructive'}>
                                            No
                                          </Button>
                                        </DialogClose>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                ) : null}

                                {task.status != 'deleted' ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        id={`mark-task-as-deleted-${task.id}`}
                                        className="mr-4"
                                        variant={'destructive'}
                                      >
                                        <Trash2Icon />
                                        <Key lable="d" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogTitle>
                                        <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                                          <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                            Are you{' '}
                                          </span>
                                          sure?
                                        </span>
                                      </DialogTitle>
                                      <DialogFooter className="flex flex-row justify-center">
                                        <DialogClose asChild>
                                          <Button
                                            className="mr-5"
                                            onClick={() => {
                                              markTaskAsDeleted(
                                                props.email,
                                                props.encryptionSecret,
                                                props.UUID,
                                                task.uuid
                                              );
                                              setIsDialogOpen(false);
                                            }}
                                          >
                                            Yes
                                          </Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                          <Button variant={'destructive'}>
                                            No
                                          </Button>
                                        </DialogClose>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                ) : null}
                                <DialogClose asChild>
                                  <Button className="bg-white">Close</Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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
                        className="border rounded-md px-2 py-1 bg-black text-white h-10 text-sm"
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
                      <Dialog
                        open={isAddTaskOpen}
                        onOpenChange={setIsAddTaskOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddTaskOpen(true)}
                          >
                            Add Task
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                                <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                  Add a{' '}
                                </span>
                                new task
                              </span>
                            </DialogTitle>
                            <DialogDescription>
                              Fill in the details below to add a new task.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label
                                htmlFor="description"
                                className="text-right"
                              >
                                Description
                              </Label>
                              <Input
                                id="description"
                                name="description"
                                type="text"
                                value={newTask.description}
                                onChange={(e) =>
                                  setNewTask({
                                    ...newTask,
                                    description: e.target.value,
                                  })
                                }
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="priority" className="text-right">
                                Priority
                              </Label>
                              <div className="col-span-1 flex items-center">
                                <select
                                  id="priority"
                                  name="priority"
                                  value={newTask.priority}
                                  onChange={(e) =>
                                    setNewTask({
                                      ...newTask,
                                      priority: e.target.value,
                                    })
                                  }
                                  className="border rounded-md px-2 py-1 w-full bg-black text-white"
                                >
                                  <option value="H">H</option>
                                  <option value="M">M</option>
                                  <option value="L">L</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label
                                htmlFor="description"
                                className="text-right"
                              >
                                Project
                              </Label>
                              <Input
                                id="project"
                                name="project"
                                type=""
                                value={newTask.project}
                                onChange={(e) =>
                                  setNewTask({
                                    ...newTask,
                                    project: e.target.value,
                                  })
                                }
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="due" className="text-right">
                                Due
                              </Label>
                              <div className="col-span-3">
                                <DatePicker
                                  date={
                                    newTask.due
                                      ? new Date(newTask.due)
                                      : undefined
                                  }
                                  onDateChange={(date) => {
                                    setNewTask({
                                      ...newTask,
                                      due: date
                                        ? format(date, 'yyyy-MM-dd')
                                        : '',
                                    });
                                  }}
                                  placeholder="Select a due date"
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="secondary"
                              onClick={() => setIsAddTaskOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              className="mb-1"
                              variant="default"
                              onClick={() =>
                                handleAddTask(
                                  props.email,
                                  props.encryptionSecret,
                                  props.UUID,
                                  newTask.description,
                                  newTask.project,
                                  newTask.priority,
                                  newTask.due,
                                  newTask.tags
                                )
                              }
                            >
                              Add Task
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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
