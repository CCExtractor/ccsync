import { useEffect, useState } from "react";
import { Task } from "../../utils/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "../../ui/button";
import { firestore, tasksCollection } from "@/lib/controller";
import { collection, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { ArrowUpDown, CheckIcon, CopyIcon, Folder, PencilIcon, Tag, Trash2Icon, XIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import CopyToClipboard from "react-copy-to-clipboard";
import { formattedDate, getDisplayedPages, handleCopy, handleDate, markTaskAsCompleted, markTaskAsDeleted, Props, sortTasks, sortTasksById } from "./tasks-utils";
import Pagination from "./Pagination";
import { url } from "@/lib/URLs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomBar from "../BottomBar/BottomBar";

export const Tasks = (props: Props) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [uniqueProjects, setUniqueProjects] = useState<string[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>("all");
    const [tempTasks, setTempTasks] = useState<Task[]>([]); // Temporary tasks state
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const status = ["pending", "completed", "deleted"];
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [idSortOrder, setIdSortOrder] = useState<'asc' | 'desc'>('asc');

    const [newTask, setNewTask] = useState({ description: "", priority: "", project: "", due: "" });
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [_isDialogOpen, setIsDialogOpen] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editedDescription, setEditedDescription] = useState("");
    const [_selectedTask, setSelectedTask] = useState(null);

    const tasksPerPage = 10;
    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    const currentTasks = tempTasks.slice(indexOfFirstTask, indexOfLastTask);
    const emptyRows = tasksPerPage - currentTasks.length;
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
    const totalPages = Math.ceil(tasks.length / tasksPerPage);

    useEffect(() => {
        const fetchTasksForEmail = async () => {
            try {
                const snapshot = await getDocs(query(collection(firestore, 'tasks'), where('email', '==', props.email)));
                const tasksFromDB: Task[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: data.id,
                        description: data.description,
                        project: data.project,
                        tags: data.tags,
                        status: data.status,
                        uuid: data.uuid,
                        urgency: data.urgency,
                        priority: data.priority,
                        due: data.due,
                        end: data.end,
                        entry: data.entry,
                        modified: data.modified,
                        email: data.email,
                    };
                });
                setTasks(sortTasksById(tasksFromDB, 'desc'));
                setTempTasks(sortTasksById(tasksFromDB, 'desc'));
                console.log('Tasks fetched successfully for email: ' + props.email);

                // Extract unique projects
                const projectsSet = new Set(tasksFromDB.map(task => task.project));
                const filteredProjects = Array.from(projectsSet).filter(project => project !== "")
                    .sort((a, b) => (a > b ? 1 : -1));
                setUniqueProjects(filteredProjects);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        }; fetchTasksForEmail();
    }, [props.email]);

    async function syncTasksWithTwAndDb() {
        try {
            const user_email = props.email;
            const encryptionSecret = props.encryptionSecret;
            const UUID = props.UUID;
            const backendURL = url.backendURL + `/tasks?email=${encodeURIComponent(user_email)}&encryptionSecret=${encodeURIComponent(encryptionSecret)}&UUID=${encodeURIComponent(UUID)}`;

            // Fetch tasks from Firebase Firestore
            const snapshot = await getDocs(tasksCollection);
            const firebaseTasks = snapshot.docs.map(doc => ({ uuid: doc.id, ...doc.data() }));

            // Fetch tasks from Taskwarrior
            const response = await fetch(backendURL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }); if (response.ok) {
                console.log('Synced Tasks successfully!')
                toast.success(`Tasks synced successfully!`, {
                    position: "bottom-left",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } else {
                console.log('Failed to sync tasks. Please try again.')
                toast.error(`Failed to sync tasks. Please try again.`, {
                    position: "bottom-left",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }
            const taskwarriorTasks = await response.json();
            const firebaseTaskUuids = new Set(firebaseTasks.map(task => task.uuid));

            await Promise.all(taskwarriorTasks.map(async (task: any) => {
                task.email = user_email;
                if (!firebaseTaskUuids.has(task.uuid)) {
                    const newTaskRef = doc(tasksCollection, task.uuid);
                    await setDoc(newTaskRef, task);
                    console.log('tasks synced with db!')
                } else {
                    const existingTaskRef = doc(tasksCollection, task.uuid);
                    await updateDoc(existingTaskRef, task);
                    console.log('no changes made to the tasks, so tasks not synced with db!')
                }
            }));
            // After successful synchronization, fetch the updated tasks
            const newsnapshot = await getDocs(query(collection(firestore, 'tasks'), where('email', '==', props.email)));
            const tasksFromDB: Task[] = newsnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: data.id,
                    description: data.description,
                    project: data.project,
                    tags: data.tags,
                    status: data.status,
                    uuid: data.uuid,
                    urgency: data.urgency,
                    priority: data.priority,
                    due: data.due,
                    end: data.end,
                    entry: data.entry,
                    modified: data.modified,
                    email: data.email,
                };
            });

            // Update the tasks state with the new data
            setTasks(sortTasksById(tasksFromDB, 'desc'));
            console.log('Tasks synced successfully');
        } catch (error) {
            console.log('Error syncing tasks on frontend: ', error);
        }
    }

    async function handleAddTask(email: string, encryptionSecret: string, UUID: string, description: string, project: string, priority: string, due: string,) {
        if (handleDate(newTask.due)) {
            try {
                const backendURL = url.backendURL + `add-task`;
                const response = await fetch(backendURL, {
                    method: 'POST',
                    body: JSON.stringify({
                        email: email,
                        encryptionSecret: encryptionSecret,
                        UUID: UUID,
                        description: description,
                        project: project,
                        priority: priority,
                        due: due,
                    }),
                });
                if (response) {
                    console.log('Task added successfully!');
                    toast.success('Task added successfully!', {
                        position: 'bottom-left',
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    setNewTask({ description: "", priority: "", project: "", due: "" });
                    setIsAddTaskOpen(false);
                } else {
                    toast.error('Error in adding task. Please try again.', {
                        position: 'bottom-left',
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    console.error('Failed to mark task as completed');
                }
            } catch (error) {
                console.error('Failed to add task: ', error);
            }
        }
    }

    async function handleEditTaskDesc(email: string, encryptionSecret: string, UUID: string, description: string, taskuuid: string) {
        try {
            const backendURL = url.backendURL + `edit-task`;
            const response = await fetch(backendURL, {
                method: 'POST',
                body: JSON.stringify({
                    email: email,
                    encryptionSecret: encryptionSecret,
                    UUID: UUID,
                    taskuuid: taskuuid,
                    description: description,
                }),
            });
            if (response) {
                console.log('Task edited successfully!');
                toast.success('Task edited successfully!', {
                    position: 'bottom-left',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                syncTasksWithTwAndDb();
                setIsAddTaskOpen(false);
            } else {
                toast.error('Error in editing task. Please try again.', {
                    position: 'bottom-left',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                console.error('Failed to edit task');
            }
        } catch (error) {
            console.error('Failed to edit task: ', error);
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
        handleEditTaskDesc(props.email, props.encryptionSecret, props.UUID, task.description, task.uuid);
        setIsEditing(false);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
    };

    const handleDialogOpenChange = (_isDialogOpen: boolean, task: any) => {
        setIsDialogOpen(_isDialogOpen);
        if (!_isDialogOpen) {
            setIsEditing(false);
            setEditedDescription("");
        } else {
            setSelectedTask(task);
            setEditedDescription(task?.description || "");
        }
    };

    const handleProjectChange = (value: string) => {
        setSelectedProject(value);
    };

    // useEffect to update tempTasks whenever selectedProject changes
    useEffect(() => {
        if (selectedProject === "all") {
            setTempTasks(tasks);
        } else {
            const filteredTasks = tasks.filter(task => task.project === selectedProject);
            setTempTasks(sortTasksById(filteredTasks, 'desc'));
        }
    }, [selectedProject, tasks]);

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
    };

    useEffect(() => {
        if (selectedStatus === "all") {
            setTempTasks(tasks);
        } else {
            const filteredTasks = tasks.filter(task => task.status === selectedStatus);
            setTempTasks(sortTasksById(filteredTasks, 'desc'));
        }
    }, [selectedStatus, tasks]);

    return (
        <section id="tasks" className="container py-24 pl-1 pr-1 md:pr-4 md:pl-4 sm:py-32">
            <BottomBar
                projects={uniqueProjects}
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
                status={["pending", "completed", "deleted"]}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
            />
            <h2 data-testid="tasks" className="text-3xl md:text-4xl font-bold text-center">
                <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                    Tasks
                </span>
            </h2>
            {tasks.length != 0 ? (<>
                <div className="mt-10 pl-1 md:pl-4 pr-1 md:pr-4 bg-muted/50 border shadow-md rounded-lg p-4 h-full py-12">
                    {/* Table for displaying tasks */}
                    <div className="flex items-center justify-between">
                        <h3 className="ml-4 mb-4 mr-4 text-2xl mt-0 md:text-2xl font-bold">
                            <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                Here are{" "}
                            </span>
                            your tasks
                        </h3>
                        <div className="flex items-center justify-left">
                            <Select onValueChange={handleProjectChange}>
                                <SelectTrigger className="w-[180px] hidden sm:flex mr-2">
                                    <SelectValue placeholder="Select a project" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Select Project</SelectLabel>
                                        <SelectItem value="all">All Projects</SelectItem>
                                        {uniqueProjects.map((project) => (
                                            <SelectItem key={project} value={project ? project : 'all'}>
                                                {project}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Select value={selectedStatus || ""} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-[120px]  hidden sm:flex mr-2">
                                    <SelectValue placeholder="Select a project" />
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
                            <div className="pr-2">
                                <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" onClick={() => setIsAddTaskOpen(true)}>Add Task</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                                                    <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                                        Add a{" "}
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
                                                <Label htmlFor="description" className="text-right">
                                                    Description
                                                </Label>
                                                <Input
                                                    id="description"
                                                    name="description"
                                                    type="text"
                                                    value={newTask.description}
                                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                                    className="col-span-3" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="priority" className="text-right">
                                                    Priority
                                                </Label>
                                                <div className="col-span-1 flex items-center">
                                                    <select id="priority" name="priority" value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                                        className="border rounded-md px-2 py-1 w-full bg-black text-white">
                                                        <option value="H">H</option>
                                                        <option value="M">M</option>
                                                        <option value="L">L</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="description" className="text-right">
                                                    Project
                                                </Label>
                                                <Input
                                                    id="project"
                                                    name="project"
                                                    type=""
                                                    value={newTask.project}
                                                    onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                                                    className="col-span-3" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="description" className="text-right">
                                                    Due
                                                </Label>
                                                <Input
                                                    id="due"
                                                    name="due"
                                                    placeholder="YYYY-MM-DD"
                                                    value={newTask.due}
                                                    onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
                                                    className="col-span-3" />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="secondary" onClick={() => setIsAddTaskOpen(false)}>Cancel</Button>
                                            <Button className="mb-1" variant="default" onClick={() => handleAddTask(
                                                props.email,
                                                props.encryptionSecret,
                                                props.UUID,
                                                newTask.description,
                                                newTask.project,
                                                newTask.priority,
                                                newTask.due)
                                            }>Add Task</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Button variant="outline" onClick={syncTasksWithTwAndDb}>Sync</Button>

                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table className="w-full text-white">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="py-2 w-0.20/6" onClick={handleIdSort} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                        ID {idSortOrder === 'asc' ? <ArrowUpDown className="ml-0.5 h-4 w-4" /> : <ArrowUpDown className="ml-0.5 h-4 w-4 transform rotate-180" />}
                                    </TableHead>
                                    <TableHead className="py-2 w-5/6">
                                        Description
                                    </TableHead>
                                    <TableHead className="py-2 w-0.20/6" onClick={handleSort} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                        Status <ArrowUpDown className="ml-0.5 h-4 w-4" />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Display tasks */}
                                {currentTasks.map((task: Task, index: number) => (
                                    <Dialog onOpenChange={(_isDialogOpen) => handleDialogOpenChange(_isDialogOpen, task)} key={index}>
                                        <DialogTrigger asChild>
                                            <TableRow key={index} className="border-b">
                                                {/* Display task details */}
                                                <TableCell className="py-2">
                                                    <span className="text-s text-foreground">
                                                        {task.id}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="flex items-center space-x-2 py-2">
                                                    {task.priority === "H" && (
                                                        <div className="flex items-center justify-center w-3 h-3 bg-red-500 rounded-full border-0 min-w-3">
                                                        </div>
                                                    )}
                                                    {task.priority === "M" && (
                                                        <div className="flex items-center justify-center w-3 h-3 bg-yellow-500 rounded-full border-0 min-w-3">
                                                        </div>
                                                    )}
                                                    {task.priority != "H" && task.priority != "M" && (
                                                        <div className="flex items-center justify-center w-3 h-3 bg-green-500 rounded-full border-0 min-w-3">
                                                        </div>
                                                    )}
                                                    <span className="text-s text-foreground">
                                                        {task.description}
                                                    </span>
                                                    {task.project != '' && <Badge variant={"secondary"}>
                                                        <Folder className="pr-2" />
                                                        {task.project === '' ? '' : task.project}
                                                    </Badge>}
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Badge
                                                        variant={task.status === 'pending' ? 'secondary' : task.status === 'deleted' ? 'destructive' : 'default'}
                                                    >
                                                        {task.status === 'completed' ? 'C' : task.status === 'deleted' ? 'D' : 'P'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        </DialogTrigger>
                                        <DialogContent className="sm:h-auto sm:w-auto">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                                                        <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                                            Task{" "}
                                                        </span>
                                                        Details
                                                    </span>
                                                </DialogTitle>
                                                <DialogDescription asChild>
                                                    <Table>
                                                        <TableBody>
                                                            <TableRow>
                                                                <TableCell>ID:</TableCell>
                                                                <TableCell>{task.id}</TableCell>
                                                            </TableRow><TableRow>
                                                                <TableCell>Description:</TableCell>
                                                                <TableCell>
                                                                    {isEditing ?
                                                                        <>
                                                                            <div className="flex items-center">
                                                                                <Input
                                                                                    id={`description-${task.id}`}
                                                                                    name={`description-${task.id}`}
                                                                                    type="text"
                                                                                    value={editedDescription}
                                                                                    onChange={(e) => setEditedDescription(e.target.value)}
                                                                                    className="flex-grow mr-2" />
                                                                                <Button variant="ghost" size="icon" onClick={() => handleSaveClick(task)}>
                                                                                    <CheckIcon className="h-4 w-4 text-green-500" />
                                                                                </Button>
                                                                                <Button variant="ghost" size="icon" onClick={handleCancelClick}>
                                                                                    <XIcon className="h-4 w-4 text-red-500" />
                                                                                </Button>
                                                                            </div>
                                                                        </>
                                                                        : (
                                                                            <>
                                                                                <span>{task.description}</span>
                                                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(task.description)}>
                                                                                    <PencilIcon className="h-4 w-4 text-gray-500" />
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                </TableCell>
                                                            </TableRow>
                                                            <TableRow>
                                                                <TableCell>Due:</TableCell>
                                                                <TableCell>{formattedDate(task.due)}</TableCell>
                                                            </TableRow><TableRow>
                                                                <TableCell>End:</TableCell>
                                                                <TableCell>{formattedDate(task.end)}</TableCell>
                                                            </TableRow><TableRow>
                                                                <TableCell>Priority:</TableCell>
                                                                <TableCell>{task.priority}</TableCell>
                                                            </TableRow><TableRow>
                                                                <TableCell>Project:</TableCell>
                                                                <TableCell>{task.project}</TableCell>
                                                            </TableRow><TableRow>
                                                                <TableCell>Status:</TableCell>
                                                                <TableCell>{task.status}</TableCell>
                                                            </TableRow><TableRow>
                                                                <TableCell>Tags:</TableCell>
                                                                <TableCell>
                                                                    {task.tags !== null && task.tags.length >= 1 ? (
                                                                        task.tags.map((tags, index) => (
                                                                            <Badge key={index} variant="secondary" className="mr-2">
                                                                                <Tag className="pr-3" />{tags}
                                                                            </Badge>
                                                                        ))
                                                                    ) : null}
                                                                </TableCell>
                                                            </TableRow><TableRow>
                                                                <TableCell>Urgency:</TableCell>
                                                                <TableCell>{task.urgency}</TableCell>
                                                            </TableRow><TableRow>
                                                                <TableCell>UUID:</TableCell>
                                                                <TableCell className="flex items-center">
                                                                    <span>{task.uuid}</span>
                                                                    <CopyToClipboard text={task.uuid} onCopy={() => handleCopy('Task UUID')}>
                                                                        <button className="bg-blue-500 hover:bg-gray-900 text-white font-bold py-2 px-2 rounded ml-2">
                                                                            <CopyIcon />
                                                                        </button>
                                                                    </CopyToClipboard>
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </DialogDescription>
                                            </DialogHeader>

                                            {/*Mark task as completed*/}
                                            <DialogFooter className="flex flex-row justify-end">
                                                {task.status == "pending" ? <Dialog>
                                                    <DialogTrigger asChild className="mr-5">
                                                        <Button>Mark As Completed</Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogTitle>
                                                            <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                                                                <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                                                    Are you{" "}
                                                                </span>
                                                                sure?
                                                            </span>
                                                        </DialogTitle>
                                                        <DialogFooter className="flex flex-row justify-center">
                                                            <Button className="mr-5" onClick={() => markTaskAsCompleted(
                                                                props.email,
                                                                props.encryptionSecret,
                                                                props.UUID,
                                                                task.uuid
                                                            )}>
                                                                Yes
                                                            </Button>
                                                            <DialogClose asChild>
                                                                <Button variant={"destructive"}>No</Button>
                                                            </DialogClose>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog> : null}

                                                {/*Mark task as deleted*/}
                                                {task.status != "deleted" ? <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button className="mr-4" variant={"destructive"}>
                                                            <Trash2Icon />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogTitle>
                                                            <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                                                                <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                                                    Are you{" "}
                                                                </span>
                                                                sure?
                                                            </span>
                                                        </DialogTitle>
                                                        <DialogFooter className="flex flex-row justify-center">
                                                            <Button className="mr-5" onClick={() => markTaskAsDeleted(
                                                                props.email,
                                                                props.encryptionSecret,
                                                                props.UUID,
                                                                task.uuid)}>
                                                                Yes
                                                            </Button>
                                                            <DialogClose asChild>
                                                                <Button variant={"destructive"}>No</Button>
                                                            </DialogClose>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog> : null}
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
                </div></>)
                : (<>
                    <div className="mt-10 pl-1 md:pl-4 pr-1 md:pr-4 bg-muted/50 border shadow-md rounded-lg p-4 h-full py-12">
                        <div className="flex items-center justify-between">
                            <h3 className="ml-4 mb-4 mr-4 text-2xl mt-0 md:text-2xl font-bold">
                                <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                    No tasks{" "}
                                </span>
                                found
                            </h3>
                            <div className="flex items-center justify-left">
                                <div className="pr-2">
                                    <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" onClick={() => setIsAddTaskOpen(true)}>Add Task</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    <span className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                                                        <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                                            Add a{" "}
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
                                                    <Label htmlFor="description" className="text-right">
                                                        Description
                                                    </Label>
                                                    <Input
                                                        id="description"
                                                        name="description"
                                                        type="text"
                                                        value={newTask.description}
                                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                                        className="col-span-3" />
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
                                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                                            className="border rounded-md px-2 py-1 w-full bg-black text-white"
                                                        >
                                                            <option value="H">H</option>
                                                            <option value="M">M</option>
                                                            <option value="L">L</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="description" className="text-right">
                                                        Project
                                                    </Label>
                                                    <Input
                                                        id="project"
                                                        name="project"
                                                        type=""
                                                        value={newTask.project}
                                                        onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                                                        className="col-span-3" />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="description" className="text-right">
                                                        Due
                                                    </Label>
                                                    <Input
                                                        id="due"
                                                        name="due"
                                                        placeholder="YYYY-MM-DD"
                                                        value={newTask.due}
                                                        onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
                                                        className="col-span-3" />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="secondary" onClick={() => setIsAddTaskOpen(false)}>Cancel</Button>
                                                <Button className="mb-1" variant="default" onClick={() => handleAddTask(
                                                    props.email,
                                                    props.encryptionSecret,
                                                    props.UUID,
                                                    newTask.description,
                                                    newTask.project,
                                                    newTask.priority,
                                                    newTask.due)}>Add Task</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <Button variant="outline" onClick={syncTasksWithTwAndDb}>Sync</Button>
                            </div>
                        </div>
                        <div className="text-l ml-5 text-muted-foreground mt-5 mb-5">
                            Add a new task or sync tasks from taskwarrior to view tasks.
                        </div>
                    </div>
                </>)
            }
        </section >
    );
};