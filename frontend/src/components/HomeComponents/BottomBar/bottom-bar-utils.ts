import { Dispatch, SetStateAction } from 'react';

export interface RouteProps {
  href: string;
  label: string;
}

export interface BottomBarProps {
  projects: string[] | { label: string; value: string }[];
  selectedProjects: string[];
  setSelectedProject: Dispatch<SetStateAction<string[]>>;
  status: string[] | { label: string; value: string }[];
  selectedStatuses: string[];
  setSelectedStatus: Dispatch<SetStateAction<string[]>>;
  tags: string[] | { label: string; value: string }[];
  selectedTags: string[];
  setSelectedTag: Dispatch<SetStateAction<string[]>>;
}

export const routeList: RouteProps[] = [
  { href: '#', label: 'Home' },
  { href: '#tasks', label: 'Tasks' },
];
