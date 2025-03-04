import { Dispatch, SetStateAction } from 'react';

export interface RouteProps {
  href: string;
  label: string;
}

export interface BottomBarProps {
  projects: string[];
  selectedProject: string | null;
  setSelectedProject: Dispatch<SetStateAction<string>>;

  status: string[];
  selectedStatus: string | null;
  setSelectedStatus: Dispatch<SetStateAction<string>>;
}

export const routeList: RouteProps[] = [
  { href: '#', label: 'Home' },
  { href: '#tasks', label: 'Tasks' },
];
