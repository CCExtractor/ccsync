import { useEffect, useState } from "react";
import { Task } from "../types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { firestore, tasksCollection } from "@/lib/controller";
import { collection, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { ArrowUpDown, CopyIcon, Folder, Tag, Trash2Icon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { parseISO, format } from 'date-fns';
import CopyToClipboard from "react-copy-to-clipboard";

type Props = {
    email: string;
    encryptionSecret: string;
    origin: string;
    UUID: string;
}


export const Tasks = (props: Props) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [idSortOrder, setIdSortOrder] = useState<'asc' | 'desc'>('asc');
    const [newTask, setNewTask] = useState({ description: "", priority: "", project: "", due: "" });
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const tasksPerPage = 10;

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
                        tag: data.tag,
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
                console.log('Tasks fetched successfully for email: ' + props.email);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };

        fetchTasksForEmail();
    }, [props.email]);

    async function syncTasksWithTwAndDb() {
        try {
            const backendURL = import.meta.env.VITE_BACKEND_URL;
            const user_email = props.email;

            const email = props.email;
            const encryptionSecret = props.encryptionSecret;
            const UUID = props.UUID;

            const url = backendURL + `/tasks?email=${encodeURIComponent(email)}&encryptionSecret=${encodeURIComponent(encryptionSecret)}&UUID=${encodeURIComponent(UUID)}`;

            // Fetch tasks from Firebase Firestore
            const snapshot = await getDocs(tasksCollection);
            const firebaseTasks = snapshot.docs.map(doc => ({ uuid: doc.id, ...doc.data() }));

            // Fetch tasks from Taskwarrior
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
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
            }
            if (!response.ok) {
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
                    tag: data.tag,
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

    async function markTaskAsCompleted(taskuuid: string) {
        try {
            const backendURL = import.meta.env.VITE_BACKEND_URL;
            const url = backendURL + `complete-task`;

            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify({
                    email: props.email,
                    encryptionSecret: props.encryptionSecret,
                    UUID: props.UUID,
                    taskuuid: taskuuid,
                }),
            });

            if (response) {
                console.log('Task marked as completed successfully!');
                toast.success('Task marked as completed successfully!', {
                    position: 'bottom-left',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } else {
                toast.error('Error in marked the task as completed. Please try again.', {
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
            console.error('Error marking task as completed:', error);
        }
    }

    async function markTaskAsDeleted(taskuuid: string) {
        try {
            const backendURL = import.meta.env.VITE_BACKEND_URL;
            const url = backendURL + `delete-task`;

            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify({
                    email: props.email,
                    encryptionSecret: props.encryptionSecret,
                    UUID: props.UUID,
                    taskuuid: taskuuid,
                }),
            });

            if (response) {
                console.log('Task marked as deleted successfully!');
                toast.success('Task marked as deleted successfully!', {
                    position: 'bottom-left',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } else {
                toast.error('Error in marked the task as deleted. Please try again.', {
                    position: 'bottom-left',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                console.error('Failed to mark task as deleted');
            }
        } catch (error) {
            console.error('Error marking task as deleted:', error);
        }
    }

    async function handleAddTask(email: string, encryptionSecret: string, UUID: string, description: string, project: string, priority: string, due: string,) {
        try {
            const backendURL = import.meta.env.VITE_BACKEND_URL;
            const url = backendURL + `add-task`;
            const response = await fetch(url, {
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
                setIsDialogOpen(false);
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

    const sortTasks = (tasks: Task[], order: 'asc' | 'desc') => {
        return tasks.sort((a, b) => {
            if (a.status < b.status) return order === 'asc' ? -1 : 1;
            if (a.status > b.status) return order === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const sortTasksById = (tasks: Task[], order: 'asc' | 'desc') => {
        return tasks.sort((a, b) => {
            if (order === 'asc') {
                return a.id < b.id ? -1 : 1;
            } else {
                return b.id < a.id ? -1 : 1;
            }
        });
    };

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

    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);

    const emptyRows = tasksPerPage - currentTasks.length;

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const totalPages = Math.ceil(tasks.length / tasksPerPage);

    const getDisplayedPages = () => {
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

    const formattedDate = (dateString: string) => {
        try {
            return format(parseISO(dateString), 'PPpp');
        } catch (error) {
            return dateString;
        }
    };

    const handleCopy = (text: string) => {
        toast.success(`${text} copied to clipboard!`, {
            position: "bottom-left",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    return (
        <section id="tasks" className="container py-24 pl-1 pr-1 md:pr-4 md:pl-4 sm:py-32">
            <h2 className="text-3xl md:text-4xl font-bold text-center">
                <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                    Tasks
                </span>
            </h2>
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
                        <div className="pr-2">
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(true)}>Add Task</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            <h3 className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                                                <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                                    Add a{" "}
                                                </span>
                                                new task
                                            </h3>
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
                                                className="col-span-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="description" className="text-right">
                                                Due
                                            </Label>
                                            <Input
                                                id="due"
                                                name="due"
                                                type=""
                                                placeholder="YYYY-MM-DD"
                                                value={newTask.due}
                                                onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
                                                className="col-span-3"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                        <Button className="mb-1" variant="default" onClick={() => handleAddTask(
                                            props.email,
                                            props.encryptionSecret,
                                            props.UUID,
                                            newTask.description,
                                            newTask.project,
                                            newTask.priority,
                                            newTask.due,)}>Add Task</Button>
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
                                <Dialog key={index}>
                                    <DialogTrigger asChild>
                                        <TableRow key={index} className="border-b">
                                            {/* Display task details */}
                                            <TableCell className="py-2">{task.id}</TableCell>
                                            <TableCell className="flex items-center space-x-2 py-2">
                                                <span>{task.description}</span>
                                                {task.project != '' && <Badge variant={"secondary"}>
                                                    <Folder className="pr-2" />
                                                    {task.project === '' ? 'none' : task.project}
                                                </Badge>}
                                                {task.tag != '' && <Badge variant={"secondary"}>
                                                    <Tag className="pr-2" />
                                                    {task.tag === '' ? 'none' : task.tag}
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
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>
                                                <h3 className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                                                    <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                                        Task{" "}
                                                    </span>
                                                    Details
                                                </h3>
                                            </DialogTitle>
                                            <DialogDescription>
                                                <Table>
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell>ID:</TableCell>
                                                            <TableCell>{task.id}</TableCell>
                                                        </TableRow><TableRow>
                                                            <TableCell>Description:</TableCell>
                                                            <TableCell>{task.description}</TableCell>
                                                        </TableRow><TableRow>
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
                                                            <TableCell>Tag:</TableCell>
                                                            <TableCell>{task.tag}</TableCell>
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
                                                <DialogTrigger className="mr-5">
                                                    <Button >Mark As Completed</Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogTitle>
                                                        <h3 className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                                                            <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                                                Are you{" "}
                                                            </span>
                                                            sure?
                                                        </h3>
                                                    </DialogTitle>
                                                    <DialogFooter className="flex flex-row justify-center">
                                                        <Button className="mr-5" onClick={() => markTaskAsCompleted(task.uuid)}>
                                                            Yes
                                                        </Button>
                                                        <DialogClose>
                                                            <Button variant={"destructive"}>No</Button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog> : null}

                                            {/*Mark task as deleted*/}
                                            {task.status != "deleted" ? <Dialog>
                                                <DialogTrigger>
                                                    <Button className="mr-4" variant={"destructive"}>
                                                        <Trash2Icon />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogTitle>
                                                        <h3 className="ml-0 mb-0 mr-0 text-2xl mt-0 md:text-2xl font-bold">
                                                            <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                                                Are you{" "}
                                                            </span>
                                                            sure?
                                                        </h3>
                                                    </DialogTitle>
                                                    <DialogFooter className="flex flex-row justify-center">
                                                        <Button className="mr-5" onClick={() => markTaskAsDeleted(task.uuid)}>
                                                            Yes
                                                        </Button>
                                                        <DialogClose>
                                                            <Button variant={"destructive"}>No</Button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog> : null}
                                            <DialogClose>
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
                <div className="flex justify-center mt-4 space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <nav>
                        <ul className="flex space-x-2">
                            {getDisplayedPages().map(page => (
                                <li key={page}>
                                    <Button
                                        variant={currentPage === page ? "secondary" : "outline"}
                                        onClick={() => paginate(page)}
                                    >
                                        {page}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </section >
    );
};