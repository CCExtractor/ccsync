export interface RouteProps {
    href: string;
    label: string;
}

export const routeList: RouteProps[] = [
    { href: "#", label: "Home" },
    { href: "#tasks", label: "Tasks" },
];