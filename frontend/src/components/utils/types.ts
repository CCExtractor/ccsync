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
  data: ReportData[];
  title: string;
  chartId: string;
};

export type ReportData = {
  name: string;
  completed: number;
  ongoing: number;
};

export type AutoSyncProps = {
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  isAutoSyncEnabled: boolean;
  syncInterval: number; // <-- This prop controls the timer
};

export interface EditTaskState {
  isEditing: boolean;
  editedDescription: string;
  isEditingTags: boolean;
  editedTags: string[];
  editTagInput: string;
  isEditingPriority: boolean;
  editedPriority: string;
  isEditingProject: boolean;
  editedProject: string;
  isEditingWaitDate: boolean;
  editedWaitDate: string;
  isEditingStartDate: boolean;
  editedStartDate: string;
  isEditingEntryDate: boolean;
  editedEntryDate: string;
  isEditingEndDate: boolean;
  editedEndDate: string;
  isEditingDueDate: boolean;
  editedDueDate: string;
  isEditingDepends: boolean;
  editedDepends: string[];
  dependsDropdownOpen: boolean;
  dependsSearchTerm: string;
}

export interface TaskFormData {
  description: string;
  priority: string;
  project: string;
  due: string;
  tags: string[];
}

export interface AddTaskDialogProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  newTask: TaskFormData;
  setNewTask: (task: TaskFormData) => void;
  tagInput: string;
  setTagInput: (value: string) => void;
  onSubmit: (task: TaskFormData) => void;
}
