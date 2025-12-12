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

export interface Annotation {
  entry: string;
  description: string;
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
  annotations: Annotation[];
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
  isEditingRecur: boolean;
  editedRecur: string;
  originalRecur: string;
}

export interface TaskFormData {
  description: string;
  priority: string;
  project: string;
  due: string;
  start: string;
  wait: string;
  end: string;
  recur: string;
  tags: string[];
  annotations: Annotation[];
}

export interface AddTaskDialogProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  newTask: TaskFormData;
  setNewTask: (task: TaskFormData) => void;
  tagInput: string;
  setTagInput: (value: string) => void;
  onSubmit: (task: TaskFormData) => void;
  isCreatingNewProject: boolean;
  setIsCreatingNewProject: (value: boolean) => void;
  uniqueProjects: string[];
}

export interface EditTaskDialogProps {
  index: number;
  task: Task;
  isOpen: boolean;
  selectedIndex: number;
  onOpenChange: (open: boolean) => void;
  onSelectTask: (task: Task, index: number) => void;
  editState: EditTaskState;
  onUpdateState: (updates: Partial<EditTaskState>) => void;
  allTasks: Task[];
  onSaveDescription: (task: Task, description: string) => void;
  onSaveTags: (task: Task, tags: string[]) => void;
  onSavePriority: (task: Task, priority: string) => void;
  onSaveProject: (task: Task, project: string) => void;
  onSaveWaitDate: (task: Task, date: string) => void;
  onSaveStartDate: (task: Task, date: string) => void;
  onSaveEntryDate: (task: Task, date: string) => void;
  onSaveEndDate: (task: Task, date: string) => void;
  onSaveDueDate: (task: Task, date: string) => void;
  onSaveDepends: (task: Task, depends: string[]) => void;
  onSaveRecur: (task: Task, recur: string) => void;
  onMarkComplete: (uuid: string) => void;
  onMarkDeleted: (uuid: string) => void;
  isOverdue: (due?: string) => boolean;
}
