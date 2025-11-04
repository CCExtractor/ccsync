export interface RouteProps {
  href: string;
  label: string;
}

export interface BottomBarProps {
  onOpenFilterSheet: () => void;
  activeFilterCount: number;
}

export const routeList: RouteProps[] = [
  { href: '#', label: 'Home' },
  { href: '#tasks', label: 'Tasks' },
];
