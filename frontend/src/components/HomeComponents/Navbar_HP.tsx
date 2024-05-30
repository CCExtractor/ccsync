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

import { LogOut, Github } from "lucide-react";

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

interface RouteProps {
    href: string;
    label: string;
}

type Props = {
    imgurl: string;
    email: string;
};


const handleLogout = async () => {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    console.log(backendURL)
    try {
        const response = await fetch(backendURL + "auth/logout", {
            method: "POST",
            credentials: "include",
        });
        if (response.ok) {
            // Redirect to the landing page after logout
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
    }, {
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
                                        onClick={handleLogout}
                                        className={`w-[110px] border ${buttonVariants({
                                            variant: "destructive",
                                        })}`}> Log out</div>
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar>
                                    <AvatarImage src={props.imgurl} />
                                    <AvatarFallback>CN</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                <DropdownMenuLabel>{props.email}</DropdownMenuLabel>
                                <DropdownMenuItem>
                                    <Github className="mr-2 h-4 w-4" />
                                    <span>GitHub</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <div onClick={handleLogout}>Log out</div>
                                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
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
