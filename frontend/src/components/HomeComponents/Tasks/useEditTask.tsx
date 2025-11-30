import { useState, useEffect } from 'react';
import { Task } from '../../utils/types';

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

export const useEditTask = (selectedTask: Task | null) => {
  const [state, setState] = useState<EditTaskState>({
    isEditing: false,
    editedDescription: '',
    isEditingTags: false,
    editedTags: [],
    editTagInput: '',
    isEditingPriority: false,
    editedPriority: 'NONE',
    isEditingProject: false,
    editedProject: '',
    isEditingWaitDate: false,
    editedWaitDate: '',
    isEditingStartDate: false,
    editedStartDate: '',
    isEditingEntryDate: false,
    editedEntryDate: '',
    isEditingEndDate: false,
    editedEndDate: '',
    isEditingDueDate: false,
    editedDueDate: '',
    isEditingDepends: false,
    editedDepends: [],
    dependsDropdownOpen: false,
    dependsSearchTerm: '',
  });

  // Update edited tags when selected task changes
  useEffect(() => {
    if (selectedTask) {
      setState((prev) => ({
        ...prev,
        editedTags: selectedTask.tags || [],
        editedDescription: selectedTask.description || '',
        editedPriority: selectedTask.priority || 'NONE',
        editedProject: selectedTask.project || '',
      }));
    }
  }, [selectedTask]);

  const resetState = () => {
    setState({
      isEditing: false,
      editedDescription: '',
      isEditingTags: false,
      editedTags: [],
      editTagInput: '',
      isEditingPriority: false,
      editedPriority: 'NONE',
      isEditingProject: false,
      editedProject: '',
      isEditingWaitDate: false,
      editedWaitDate: '',
      isEditingStartDate: false,
      editedStartDate: '',
      isEditingEntryDate: false,
      editedEntryDate: '',
      isEditingEndDate: false,
      editedEndDate: '',
      isEditingDueDate: false,
      editedDueDate: '',
      isEditingDepends: false,
      editedDepends: [],
      dependsDropdownOpen: false,
      dependsSearchTerm: '',
    });
  };

  const updateState = (updates: Partial<EditTaskState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return {
    state,
    updateState,
    resetState,
  };
};
