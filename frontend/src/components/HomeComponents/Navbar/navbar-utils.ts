import { toast } from "react-toastify";
import { tasksCollection } from "@/lib/controller";
import { deleteDoc, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";

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
};

export const routeList: RouteProps[] = [
    { href: "#", label: "Home" },
    { href: "#tasks", label: "Tasks" },
    { href: "#setup-guide", label: "Setup Guide" },
    { href: "#faq", label: "FAQ" },
];

export const handleLogout = async () => {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    try {
        const response = await fetch(backendURL + "auth/logout", {
            method: "POST",
            credentials: "include",
        });
        if (response.ok) {
            window.location.href = "/";
        } else {
            console.error("Failed to logout");
        }
    } catch (error) {
        console.error("Error logging out:", error);
    }
};

export const syncTasksWithTwAndDb = async (props: Props) => {
    try {
        const backendURL = import.meta.env.VITE_BACKEND_URL;
        const user_email = props.email;

        const email = props.email;
        const encryptionSecret = props.encryptionSecret;
        const UUID = props.UUID;

        const url = backendURL + `tasks?email=${encodeURIComponent(email)}&encryptionSecret=${encodeURIComponent(encryptionSecret)}&UUID=${encodeURIComponent(UUID)}`;

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
            console.log('Synced Tasks succesfully!')
            toast.success(`Tasks synced succesfully!`, {
                position: "bottom-left",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } else {
            console.log('Server is down. Failed to sync tasks')
            toast.error(`Server is down. Failed to sync tasks`, {
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
                console.log('Tasks synced with db!')
            } else {
                const existingTaskRef = doc(tasksCollection, task.uuid);
                await updateDoc(existingTaskRef, task);
                console.log('No changes made to the tasks, so tasks not synced with db'!)
            }
        }));
    } catch (error) {
        console.log('Error syncing tasks on frontend: ', error);
    }
};

export const deleteAllTasks = async (props: Props) => {
    try {
        // show a loading toast
        const loadingToastId = toast.info(`Deleting all tasks for ${props.email}...`, {
            position: "bottom-left",
            autoClose: false,
            hideProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });

        const snapshot = await getDocs(tasksCollection);
        const tasksToDelete = snapshot.docs.filter((doc) => doc.data().email === props.email);

        await Promise.all(
            tasksToDelete.map(async (task) => {
                const taskRef = doc(tasksCollection, task.id);
                await deleteDoc(taskRef);
            })
        );

        // remove the loading toast and show success toast
        toast.update(loadingToastId, {
            render: `All tasks for ${props.email} deleted successfully!`,
            type: "success",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });

        console.log(`All tasks for ${props.email} deleted successfully!`);
    } catch (error) {
        // Remove the loading toast and show error toast
        toast.error(`Error deleting tasks for ${props.email}: ${error}`, {
            position: "bottom-left",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });

        console.error(`Error deleting tasks for ${props.email}:`, error);
    }
};
