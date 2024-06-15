import { useState } from "react";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

import { LogOut, Github, Trash2 } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { buttonVariants } from "../ui/button";
import { Menu } from "lucide-react";
import { ModeToggle } from "../theme-mode-toggle";
import logo from "../../assets/logo.png";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { toast } from "react-toastify";
import { tasksCollection } from "@/lib/controller";
import { deleteDoc, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";

interface RouteProps {
    href: string;
    label: string;
}

type Props = {
    imgurl: string;
    email: string;
    encryptionSecret: string;
    origin: string;
    UUID: string;
};


const handleLogout = async () => {
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



const routeList: RouteProps[] = [
    {
        href: "#",
        label: "Home",
    },
    {
        href: "#tasks",
        label: "Tasks",
    },
    {
        href: "#setup-guide",
        label: "Setup Guide",
    },
    {
        href: "#faq",
        label: "FAQ",
    },
];

export const Navbar = (props: Props) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    async function syncTasksWithTwAndDb() {
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
    }

    async function deleteAllTasks() {
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
    }

    return (
        <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-slate-700 dark:bg-background">
            <NavigationMenu className="mx-auto">
                <NavigationMenuList className="container h-14 px-4 w-screen flex justify-between ">
                    <NavigationMenuItem className="font-bold flex">
                        <a
                            rel="noreferrer noopener"
                            href="/"
                            className="ml-2 font-bold text-xl flex items-center"
                        >
                            <img src={logo} alt="Logo" className="h-12 mr-0 mt-2 bg-blend-soft-light" /> {/* Adjust the image size and margin as needed */}
                        </a>
                    </NavigationMenuItem>

                    {/* mobile */}
                    <span className="flex md:hidden">
                        <ModeToggle />

                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger className="px-2">
                                <Menu
                                    className="flex md:hidden h-5 w-5"
                                    onClick={() => setIsOpen(true)}
                                >
                                    <span className="sr-only">Menu Icon</span>
                                </Menu>
                            </SheetTrigger>

                            <SheetContent side={"left"}>
                                <SheetHeader>
                                    <SheetTitle className="font-bold text-xl">
                                        CCSync
                                    </SheetTitle>
                                </SheetHeader>

                                <nav className="flex flex-col justify-center items-center gap-2 mt-4">
                                    {routeList.map(({ href, label }: RouteProps) => (
                                        <a
                                            rel="noreferrer noopener"
                                            key={label}
                                            href={href}
                                            onClick={() => setIsOpen(false)}
                                            className={buttonVariants({ variant: "ghost" })}
                                        >
                                            {label}
                                        </a>
                                    ))}
                                    <a
                                        rel="noreferrer noopener"
                                        href="/////////////////github"
                                        target="_blank"
                                        className={`w-[110px] border ${buttonVariants({
                                            variant: "secondary",
                                        })}`}
                                    >
                                        <GitHubLogoIcon className="mr-2 w-5 h-5" />
                                        Github
                                    </a>
                                    <div
                                        onClick={syncTasksWithTwAndDb}
                                        className={`w-[110px] border ${buttonVariants({
                                            variant: "ghost",
                                        })}`}>
                                        Sync Tasks
                                    </div>
                                    <div
                                        onClick={deleteAllTasks}
                                        className={`w-[110px] border ${buttonVariants({
                                            variant: "destructive",
                                        })}`}>
                                        Delete All Tasks
                                    </div>
                                    <div
                                        onClick={handleLogout}
                                        className={`w-[110px] border ${buttonVariants({
                                            variant: "destructive",
                                        })}`}>
                                        Log out
                                    </div>
                                </nav>

                            </SheetContent>
                        </Sheet>
                    </span>

                    {/* desktop */}
                    <nav className="hidden md:flex gap-2">
                        {routeList.map((route: RouteProps, i) => (
                            <a
                                rel="noreferrer noopener"
                                href={route.href}
                                key={i}
                                className={`text-[17px] ${buttonVariants({
                                    variant: "ghost",
                                })}`}
                            >
                                {route.label}
                            </a>
                        ))}
                    </nav>

                    <div className="hidden md:flex gap-2">
                        <div
                            onClick={syncTasksWithTwAndDb}
                            className={`w-[110px] border ${buttonVariants({
                                variant: "ghost",
                            })}`}>
                            Sync Tasks
                        </div>
                        <DropdownMenuShortcut></DropdownMenuShortcut>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar>
                                    <AvatarImage src={props.imgurl} />
                                    <AvatarFallback>CN</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                <DropdownMenuLabel>{props.email}</DropdownMenuLabel>
                                <DropdownMenuItem className="text-red-500" onClick={deleteAllTasks}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete all tasks
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Github className="mr-2 h-4 w-4" />
                                    <span>GitHub</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <div onClick={handleLogout}>Log out</div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <ModeToggle />
                    </div>
                </NavigationMenuList>
            </NavigationMenu>
        </header >
    );
};
