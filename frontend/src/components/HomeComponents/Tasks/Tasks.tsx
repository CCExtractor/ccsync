import { useEffect, useState } from 'react';
import { Task } from '../../utils/types';
import { ReportsView } from './ReportsView';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import BottomBar from '../BottomBar/BottomBar';
import {
  addTaskToBackend,
  editTaskOnBackend,
  fetchTaskwarriorTasks,
  TasksDatabase,
} from './hooks';
import { debounce } from '@/components/utils/utils';

const db = new TasksDatabase();

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
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Debounced search handler
  const debouncedSearch = debounce((value: string) => {
    if (!value) {
      setTempTasks(
        selectedProjects.length === 0 &&
          selectedStatuses.length === 0 &&
          selectedTags.length === 0
          ? tasks
          : tempTasks
      );
      return;
    }
    const lowerValue = value.toLowerCase();
    const filtered = tasks.filter(
      (task) =>
        task.description.toLowerCase().includes(lowerValue) ||
        (task.project && task.project.toLowerCase().includes(lowerValue)) ||
        (task.tags &&
          task.tags.some((tag) => tag.toLowerCase().includes(lowerValue)))
    );
    setTempTasks(filtered);
    setCurrentPage(1);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const tasksPerPage = 10;
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tempTasks.slice(indexOfFirstTask, indexOfLastTask);
  const emptyRows = tasksPerPage - currentTasks.length;
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  useEffect(() => {
    if (_selectedTask) {
      setEditedTags(_selectedTask.tags || []);
    }
  }, [_selectedTask]);

  // Load last sync time from localStorage on mount
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
      // Force re-render by updating the state
      setLastSyncTime((prevTime) => prevTime);
    }, 10000); // Update every 10 seconds

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

  async function syncTasksWithTwAndDb() {
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
    }
  }

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
    taskID: string
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
    setTasks(sortTasksById([...tasks], newOrder));
  };

  const handleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    setTasks(sortTasks([...tasks], newOrder));
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
      task.id.toString()
    );
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleDialogOpenChange = (_isDialogOpen: boolean, task: any) => {
    setIsDialogOpen(_isDialogOpen);
    if (!_isDialogOpen) {
      setIsEditing(false);
      setEditedDescription('');
    } else {
      setSelectedTask(task);
      setEditedDescription(task?.description || '');
    }
  };

  // Handle adding a tag
  const handleAddTag = () => {
    if (tagInput && !newTask.tags.includes(tagInput, 0)) {
      setNewTask({ ...newTask, tags: [...newTask.tags, tagInput] });
      setTagInput(''); // Clear the input field
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setNewTask({
      ...newTask,
      tags: newTask.tags.filter((tag) => tag !== tagToRemove),
    });
  };
  // Project Select Handler
  const handleProjectSelect = (project: string) => {
    if (project === 'all') {
      setSelectedProjects([]);
      return;
    }
    if (!selectedProjects.includes(project)) {
      setSelectedProjects((prev) => [...prev, project]);
    }
  };

  // Status Select Handler
  const handleStatusSelect = (status: string) => {
    if (status === 'all') {
      setSelectedStatuses([]);
      return;
    }
    if (!selectedStatuses.includes(status)) {
      setSelectedStatuses((prev) => [...prev, status]);
    }
  };

  // Tag Select Handler
  const handleTagSelect = (tag: string) => {
    if (tag === 'all') {
      setSelectedTags([]);
      return;
    }
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };
  useEffect(() => {
    let filteredTasks = tasks;

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

    setTempTasks(sortTasksById(filteredTasks, 'desc'));
  }, [selectedProjects, selectedStatuses, selectedTags, tasks]);

  const handleEditTagsClick = (task: Task) => {
    setEditedTags(task.tags || []);
    setIsEditingTags(true);
  };

  const handleSaveTags = (task: Task) => {
    const currentTags = task.tags || []; // Default to an empty array if tags are null
    const removedTags = currentTags.filter((tag) => !editedTags.includes(tag));
    const updatedTags = editedTags.filter((tag) => tag.trim() !== ''); // Remove any empty tags
    const tagsToRemove = removedTags.map((tag) => `-${tag}`); // Prefix `-` for removed tags
    const finalTags = [...updatedTags, ...tagsToRemove]; // Combine updated and removed tags
    console.log(finalTags);
    // Call the backend function with updated tags
    handleEditTaskOnBackend(
      props.email,
      props.encryptionSecret,
      props.UUID,
      task.description,
      finalTags,
      task.id.toString()
    );

    setIsEditingTags(false); // Exit editing mode
  };

  const handleCancelTags = () => {
    setIsEditingTags(false);
    setEditedTags([]); // Reset tags
  };

  return (
    <section
      id="tasks"
      className="container py-24 pl-1 pr-1 md:pr-4 md:pl-4 sm:py-32"
    >
      <BottomBar
        projects={uniqueProjects}
        onProjectSelect={handleProjectSelect}
        status={['pending', 'completed', 'deleted']}
        onStatusSelect={handleStatusSelect}
        tags={uniqueTags}
        onTagSelect={handleTagSelect}
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
      </div>
      {showReports ? (
        <ReportsView tasks={tasks} />
      ) : (
        <>
          {tasks.length != 0 ? (
            <>
              <div className="mt-10 pl-1 md:pl-4 pr-1 md:pr-4 bg-muted/50 border shadow-md rounded-lg p-4 h-full py-12">
                {/* Table for displaying tasks */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h3 className="ml-4 mb-4 mr-4 text-2xl mt-0 md:text-2xl font-bold">
                    <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                      Here are{' '}
                    </span>
                    your tasks
                  </h3>
                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                    <Input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full md:w-64"
                      data-testid="task-search-bar"
                    />
                    <Select onValueChange={handleProjectSelect}>
                      <SelectTrigger className="w-[180px] hidden sm:flex mr-2">
                        <SelectValue placeholder="Projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Select Project</SelectLabel>
                          <SelectItem value="all">All Projects</SelectItem>
                          {uniqueProjects.map((project) => (
                            <SelectItem
                              key={project}
                              value={project ? project : 'all'}
                            >
                              {project}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Select onValueChange={handleStatusSelect}>
                      <SelectTrigger className="w-[120px]  hidden sm:flex mr-2">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          <SelectItem value="all">All</SelectItem>
                          {status.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Select onValueChange={handleTagSelect}>
                      <SelectTrigger className="w-[180px] hidden sm:flex mr-2">
                        <SelectValue placeholder="Tags" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Select Tag</SelectLabel>
                          <SelectItem value="all">All Tags</SelectItem>
                          {uniqueTags.map((tag) => (
                            <SelectItem key={tag} value={tag}>
                              {tag}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
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
                              <Label
                                htmlFor="description"
                                className="text-right"
                              >
                                Due
                              </Label>
                              <Input
                                id="due"
                                name="due"
                                placeholder="YYYY-MM-DD"
                                value={newTask.due}
                                onChange={(e) =>
                                  setNewTask({
                                    ...newTask,
                                    due: e.target.value,
                                  })
                                }
                                required
                                className="col-span-3"
                              />
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
                                <div className="flex flex-wrap gap-2">
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
                      <Button variant="outline" onClick={syncTasksWithTwAndDb}>
                        Sync
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {getTimeSinceLastSync(lastSyncTime)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* This is the block to display active filters */}
                <div className="flex flex-col gap-2 mb-4 px-1 md:px-4">
                  {/* --- Projects Filter Group --- */}
                  {selectedProjects.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Projects:
                      </span>
                      {selectedProjects.map((project) => (
                        <Badge key={project} variant="secondary">
                          {project}
                          <XIcon
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() =>
                              setSelectedProjects((prev) =>
                                prev.filter((p) => p !== project)
                              )
                            }
                          />
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* --- Status Filter Group --- */}
                  {selectedStatuses.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Status:
                      </span>
                      {selectedStatuses.map((status) => (
                        <Badge key={status} variant="secondary">
                          {status}
                          <XIcon
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() =>
                              setSelectedStatuses((prev) =>
                                prev.filter((s) => s !== status)
                              )
                            }
                          />
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* --- Tags Filter Group --- */}
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Tags:
                      </span>
                      {selectedTags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                          <XIcon
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() =>
                              setSelectedTags((prev) =>
                                prev.filter((t) => t !== tag)
                              )
                            }
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

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
                      {currentTasks.map((task: Task, index: number) => (
                        <Dialog
                          onOpenChange={(_isDialogOpen) =>
                            handleDialogOpenChange(_isDialogOpen, task)
                          }
                          key={index}
                        >
                          <DialogTrigger asChild>
                            <TableRow key={index} className="border-b">
                              {/* Display task details */}
                              <TableCell className="py-2">
                                <span className="text-s text-foreground">
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
                                      <TableCell>{task.id}</TableCell>
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
                                        {formattedDate(task.start)}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>End:</TableCell>
                                      <TableCell>
                                        {formattedDate(task.end)}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Wait:</TableCell>
                                      <TableCell>
                                        {formattedDate(task.wait)}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Depends:</TableCell>
                                      <TableCell>{task.depends}</TableCell>
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
                                      <TableCell>{task.priority}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Project:</TableCell>
                                      <TableCell>{task.project}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Status:</TableCell>
                                      <TableCell>{task.status}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Tags:</TableCell>
                                      <TableCell>
                                        {isEditingTags ? (
                                          <div className="flex items-center">
                                            <Input
                                              type="text"
                                              value={editedTags.join(', ')}
                                              onChange={(e) =>
                                                setEditedTags(
                                                  e.target.value
                                                    .split(',')
                                                    .map((tag) => tag.trim())
                                                )
                                              }
                                              className="flex-grow mr-2"
                                            />
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() =>
                                                handleSaveTags(task)
                                              }
                                            >
                                              <CheckIcon className="h-4 w-4 text-green-500" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={handleCancelTags}
                                            >
                                              <XIcon className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center">
                                            {task.tags !== null &&
                                            task.tags.length >= 1 ? (
                                              task.tags.map((tag, index) => (
                                                <Badge
                                                  key={index}
                                                  variant="secondary"
                                                  className="mr-2"
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
                                      <TableCell>Urgency:</TableCell>
                                      <TableCell>{task.urgency}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>UUID:</TableCell>
                                      <TableCell className="flex items-center">
                                        <span>{task.uuid}</span>
                                        <CopyToClipboard
                                          text={task.uuid}
                                          onCopy={() => handleCopy('Task UUID')}
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
                                    <Button>Mark As Completed</Button>
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
                                          onClick={() =>
                                            markTaskAsCompleted(
                                              props.email,
                                              props.encryptionSecret,
                                              props.UUID,
                                              task.uuid
                                            )
                                          }
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
                                      className="mr-4"
                                      variant={'destructive'}
                                    >
                                      <Trash2Icon />
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
                                          onClick={() =>
                                            markTaskAsDeleted(
                                              props.email,
                                              props.encryptionSecret,
                                              props.UUID,
                                              task.uuid
                                            )
                                          }
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
                      ))}

                      {/* Display empty rows */}
                      {emptyRows > 0 && (
                        <TableRow style={{ height: 52 * emptyRows }}>
                          <TableCell colSpan={6} />
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  paginate={paginate}
                  getDisplayedPages={getDisplayedPages}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mt-10 pl-1 md:pl-4 pr-1 md:pr-4 bg-muted/50 border shadow-md rounded-lg p-4 h-full py-12">
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
                              <Label
                                htmlFor="description"
                                className="text-right"
                              >
                                Due
                              </Label>
                              <Input
                                id="due"
                                name="due"
                                placeholder="YYYY-MM-DD"
                                value={newTask.due}
                                onChange={(e) =>
                                  setNewTask({
                                    ...newTask,
                                    due: e.target.value,
                                  })
                                }
                                className="col-span-3"
                              />
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
                      <span className="text-xs text-muted-foreground">
                        {getTimeSinceLastSync(lastSyncTime)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-l ml-5 text-muted-foreground mt-5 mb-5">
                  Add a new task or sync tasks from taskwarrior to view tasks.
                </div>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
};
