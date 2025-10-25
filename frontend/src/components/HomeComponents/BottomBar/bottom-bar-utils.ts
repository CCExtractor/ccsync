import { Dispatch, SetStateAction } from 'react';

export interface RouteProps {
  href: string;
  label: string;
}

export interface BottomBarProps {
  projects: string[];
  setSelectedProject: Dispatch<SetStateAction<string>>;
  status: string[];
  setSelectedStatus: Dispatch<SetStateAction<string>>;
  tags: string[];
  setSelectedTag: Dispatch<SetStateAction<string>>;
}

export const routeList: RouteProps[] = [
  { href: '#', label: 'Home' },
  { href: '#tasks', label: 'Tasks' },
];
