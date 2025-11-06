import { Dispatch, SetStateAction } from 'react';

export interface RouteProps {
  href: string;
  label: string;
}

export interface BottomBarProps {
  projects: string[];
  selectedProjects: string[];
  setSelectedProject: Dispatch<SetStateAction<string[]>>;
  status: string[];
  selectedStatuses: string[];
  setSelectedStatus: Dispatch<SetStateAction<string[]>>;
  tags: string[];
  selectedTags: string[];
  setSelectedTag: Dispatch<SetStateAction<string[]>>;
}

export const routeList: RouteProps[] = [
  { href: '#', label: 'Home' },
  { href: '#tasks', label: 'Tasks' },
];
