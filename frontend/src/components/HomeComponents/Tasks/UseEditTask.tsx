import { useState, useEffect } from 'react';
import { EditTaskState, Task } from '../../utils/types';

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
    isEditingRecur: false,
    editedRecur: '',
    originalRecur: '',
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
        editedRecur: selectedTask.recur || '',
        originalRecur: selectedTask.recur || '',
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
      isEditingRecur: false,
      editedRecur: '',
      originalRecur: '',
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
