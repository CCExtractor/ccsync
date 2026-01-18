import { useState, useEffect, useRef } from 'react';
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
    isEditingAnnotations: false,
    editedAnnotations: [],
    annotationInput: '',
  });

  const previousTaskUuidRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedTask) {
      if (previousTaskUuidRef.current !== selectedTask.uuid) {
        previousTaskUuidRef.current = selectedTask.uuid;
        setState((prev) => ({
          ...prev,
          editedTags: selectedTask.tags || [],
          editedDescription: selectedTask.description || '',
          editedPriority: selectedTask.priority || 'NONE',
          editedProject: selectedTask.project || '',
          editedRecur: selectedTask.recur || '',
          originalRecur: selectedTask.recur || '',
          editedAnnotations: selectedTask.annotations || [],
          editedDepends: selectedTask.depends || [],
        }));
      }
    }
  }, [selectedTask]);

  const resetState = () => {
    previousTaskUuidRef.current = null;
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
      isEditingAnnotations: false,
      editedAnnotations: [],
      annotationInput: '',
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
