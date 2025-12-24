import { renderHook, act } from '@testing-library/react';
import { useEditTask } from '../UseEditTask';
import { Task } from '../../../utils/types';

describe('useEditTask Hook', () => {
  const mockTask: Task = {
    id: 1,
    uuid: 'task-uuid',
    description: 'Test Task',
    status: 'pending',
    project: 'ProjectA',
    tags: ['tag1'],
    priority: 'H',
    urgency: 5,
    due: '',
    start: '',
    end: '',
    entry: '',
    wait: '',
    modified: '',
    depends: [],
    rtype: '',
    recur: '',
    annotations: [],
    email: 'test@example.com',
  };

  test('initial state should be correct', () => {
    const { result } = renderHook(() => useEditTask(null));

    expect(result.current.state).toEqual({
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
  });

  test('should update state using updateState()', () => {
    const { result } = renderHook(() => useEditTask(null));

    act(() => {
      result.current.updateState({
        editedDescription: 'Updated Desc',
        isEditing: true,
      });
    });

    expect(result.current.state.editedDescription).toBe('Updated Desc');
    expect(result.current.state.isEditing).toBe(true);
  });

  test('should update state when selectedTask changes', () => {
    const { result, rerender } = renderHook(
      ({ task }: { task: Task | null }) => useEditTask(task),
      { initialProps: { task: null } as { task: Task | null } }
    );

    rerender({ task: mockTask });

    expect(result.current.state.editedDescription).toBe('Test Task');
    expect(result.current.state.editedTags).toEqual(['tag1']);
    expect(result.current.state.editedPriority).toBe('H');
    expect(result.current.state.editedProject).toBe('ProjectA');
  });

  test('resetState should reset all editing fields', () => {
    const { result } = renderHook(() => useEditTask(mockTask));

    act(() => {
      result.current.updateState({
        editedDescription: 'Temp',
        isEditing: true,
      });
    });

    act(() => {
      result.current.resetState();
    });

    expect(result.current.state.isEditing).toBe(false);
    expect(result.current.state.editedDescription).toBe('');
    expect(result.current.state.editedTags).toEqual([]);
    expect(result.current.state.editedPriority).toBe('NONE');
    expect(result.current.state.editedProject).toBe('');
  });
});
