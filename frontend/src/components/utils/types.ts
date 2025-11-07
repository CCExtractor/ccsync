export interface User {
  name: string;
  email: string;
  picture: string;
}

export interface Props {
  name: string;
  uuid: string;
  encryption_secret: string;
}

export interface CopyButtonProps {
  text: string;
  label: string;
}

export interface Task {
  id: number;
  description: string;
  project: string;
  tags: string[];
  status: string;
  uuid: string;
  urgency: number;
  priority: string;
  due: string;
  start: string;
  end: string;
  entry: string;
  wait: string;
  modified: string;
  depends: string[];
  rtype: string;
  recur: string;
  email: string;
}

export type ReportsViewProps = {
  tasks: Task[];
};

export type ReportChartProps = {
  data: any[];
  title: string;
};

export type AutoSyncProps = {
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  isAutoSyncEnabled: boolean;
  syncInterval: number; // <-- This prop controls the timer
};
