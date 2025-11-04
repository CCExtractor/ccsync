export interface RouteProps {
  href: string;
  label: string;
}

export interface BottomBarProps {
  projects: string[];
  onProjectSelect: (project: string) => void;
  status: string[];
  onStatusSelect: (status: string) => void;
  tags: string[];
  onTagSelect: (tag: string) => void;
}

export const routeList: RouteProps[] = [
  { href: '#', label: 'Home' },
  { href: '#tasks', label: 'Tasks' },
];
