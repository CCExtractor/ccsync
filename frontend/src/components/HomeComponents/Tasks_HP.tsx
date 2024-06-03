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

type Props = {
    email: string;
}

export const Tasks = (props: Props) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const tasksPerPage = 10;

    // Fetch tasks from Taskwarrior API, might be useful
    // useEffect(() => {
    //     const fetchTasksFromTW = async () => {
    //         const backendURL = import.meta.env.VITE_BACKEND_URL;
    //         try {
    //             const response = await fetch(backendURL + "/tasks");
    //             if (!response.ok) {
    //                 throw new Error("Failed to fetch tasks");
    //             }
    //             const data = await response.json();
    //             setTasks(data.reverse()); // Reverse the order of all tasks
    //         } catch (error) {
    //             console.error("Error fetching tasks:", error);
    //         }
    //     };

    //     fetchTasksFromTW();
    // }, []);

    // get tasks from db snapshot easily
    // useEffect(() => onSnapshot(tasksCollection, (snapshot) => {
    //     const tasksFromDB = snapshot.docs.map((doc) => {
    //         return {
    //             uuid: doc.id,
    //             ...doc.data(),
    //         };
    //     });
    //     setTasks(tasksFromDB);
    // }), []);

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
                const sortedTasks = tasksFromDB.sort((a, b) => (a.id < b.id ? 1 : -1));
                setTasks(sortedTasks);
                console.log(tasksFromDB);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };

        fetchTasksForEmail();
    }, [props.email]);


    async function syncTasksWithTwAndDb() {
        try {
            const user_email = props.email;

            // Fetch tasks from Firebase Firestore
            const snapshot = await getDocs(tasksCollection);
            const firebaseTasks = snapshot.docs.map(doc => ({ uuid: doc.id, ...doc.data() }));

            // Fetch tasks from Taskwarrior
            const backendURL = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(backendURL + "/tasks");
            const taskwarriorTasks = await response.json();

            const firebaseTaskUuids = new Set(firebaseTasks.map(task => task.uuid));

            // Sync tasks with Taskwarrior using your backend API
            await Promise.all(taskwarriorTasks.map(async (task: any) => {
                task.email = user_email;
                if (!firebaseTaskUuids.has(task.uuid)) {
                    const newTaskRef = doc(tasksCollection, task.uuid);
                    await setDoc(newTaskRef, task);
                    console.log("tasks synced with db!")
                } else {
                    const existingTaskRef = doc(tasksCollection, task.uuid);
                    await updateDoc(existingTaskRef, task);
                    console.log("no changes made to the tasks, so tasks not synced with db!")
                }
            }));
        } catch (error) {
            console.log('Error syncing tasks: ', error);
        }
    }

    // Calculate the index of the first and last task on the current page
    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);

    // Calculate the number of empty rows needed
    const emptyRows = tasksPerPage - currentTasks.length;

    // Change page
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

    return (
        <div id="tasks" className="max-w-10xl mx-auto h-full overflow-y-auto p-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center">
                <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                    Tasks
                </span>
            </h2>
            <div className="mt-10 bg-muted/50 border shadow-md rounded-lg p-4 h-full py-12">
                {/* Table for displaying tasks */}
                <div className="flex items-center justify-between">
                    <h3 className="ml-4 mb-4 mr-4 text-2xl mt-0 md:text-2xl font-bold">
                        <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                            Here are{" "}
                        </span>
                        your tasks
                    </h3>
                    <Button variant="outline" onClick={syncTasksWithTwAndDb}>Sync</Button>
                </div>


                <div className="overflow-x-auto">
                    <Table className="w-full text-white">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="py-2 w-3/6">Description</TableHead>
                                <TableHead className="py-2 w-1/6">Project</TableHead>
                                <TableHead className="py-2 w-1/6">Tag</TableHead>
                                <TableHead className="py-2 w-1/6">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Display tasks */}
                            {currentTasks.map((task: Task, index: number) => (
                                <TableRow key={index} className="border-b">
                                    {/* Display task details */}
                                    <TableCell className="py-2">{task.description}</TableCell>
                                    <TableCell className="py-2">{task.project}</TableCell>
                                    <TableCell className="py-2">{task.tag}</TableCell>
                                    <TableCell className="py-2">
                                        {task.status === 'completed' ? 'C' : 'P'}
                                    </TableCell>
                                    {/* Add more task details as needed */}
                                </TableRow>
                            ))}
                            {/* Display empty rows */}
                            {Array.from({ length: emptyRows }).map((_, index) => (
                                <TableRow key={`empty-${index}`} className="border-b">
                                    <TableCell className="py-2">&nbsp;</TableCell>
                                    <TableCell className="py-2">&nbsp;</TableCell>
                                    <TableCell className="py-2">&nbsp;</TableCell>
                                    <TableCell className="py-2">&nbsp;</TableCell>
                                </TableRow>
                            ))}
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
        </div>
    );
};
