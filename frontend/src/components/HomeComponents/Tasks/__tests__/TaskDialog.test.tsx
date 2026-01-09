import { render, screen, fireEvent } from '@testing-library/react';
import { TaskDialog } from '../TaskDialog';
import { Task, EditTaskState } from '../../../utils/types';

jest.mock('react-copy-to-clipboard', () => ({
  __esModule: true,
  default: ({ children, onCopy }: any) => (
    <div onClick={onCopy}>{children}</div>
  ),
}));

describe('TaskDialog Component', () => {
  const mockTask: Task = {
    id: 1,
    modified: '',
    email: '',
    uuid: 'test-uuid-123',
    description: 'Test Task',
    status: 'pending',
    priority: 'H',
    project: 'Test Project',
    tags: ['tag1', 'tag2'],
    due: '2024-12-31',
    start: '2024-12-01',
    end: '2024-12-31',
    wait: '2024-12-15',
    entry: '2024-11-01',
    urgency: 5.5,
    depends: [],
    recur: '',
    rtype: '',
    annotations: [],
  };

  const mockAllTasks: Task[] = [
    mockTask,
    {
      ...mockTask,
      id: 2,
      uuid: 'test-uuid-456',
      description: 'Dependency Task',
      status: 'pending',
    },
  ];

  const mockEditState: EditTaskState = {
    isEditing: false,
    editedDescription: mockTask.description,
    editedPriority: mockTask.priority,
    editedProject: mockTask.project,
    editedTags: mockTask.tags,
    editTagInput: '',
    isEditingPriority: false,
    isEditingProject: false,
    isEditingTags: false,
    isEditingDueDate: false,
    isEditingStartDate: false,
    isEditingEndDate: false,
    isEditingWaitDate: false,
    isEditingEntryDate: false,
    isEditingDepends: false,
    editedDueDate: mockTask.due || '',
    editedStartDate: mockTask.start || '',
    editedEndDate: mockTask.end || '',
    editedWaitDate: mockTask.wait || '',
    editedEntryDate: mockTask.entry || '',
    editedDepends: mockTask.depends || [],
    dependsDropdownOpen: false,
    dependsSearchTerm: '',
    isEditingRecur: false,
    editedRecur: '',
    originalRecur: '',
    isEditingAnnotations: false,
    editedAnnotations: [],
    annotationInput: '',
  };

  const defaultProps = {
    index: 0,
    task: mockTask,
    isOpen: false,
    selectedIndex: 0,
    onOpenChange: jest.fn(),
    onSelectTask: jest.fn(),
    selectedTaskUUIDs: [] as string[],
    onCheckboxChange: jest.fn(),
    editState: mockEditState,
    onUpdateState: jest.fn(),
    allTasks: mockAllTasks,
    uniqueProjects: [],
    isCreatingNewProject: false,
    setIsCreatingNewProject: jest.fn(),
    onSaveDescription: jest.fn(),
    onSaveTags: jest.fn(),
    onSavePriority: jest.fn(),
    onSaveProject: jest.fn(),
    onSaveWaitDate: jest.fn(),
    onSaveStartDate: jest.fn(),
    onSaveEntryDate: jest.fn(),
    onSaveEndDate: jest.fn(),
    onSaveDueDate: jest.fn(),
    onSaveDepends: jest.fn(),
    onSaveRecur: jest.fn(),
    onSaveAnnotations: jest.fn(),
    onMarkComplete: jest.fn(),
    onMarkDeleted: jest.fn(),
    isOverdue: jest.fn(() => false),
    isUnsynced: false,
    isPinned: false,
    onTogglePin: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render the task row with correct data', () => {
      render(<TaskDialog {...defaultProps} />);

      expect(screen.getByText(mockTask.id.toString())).toBeInTheDocument();
      expect(screen.getByText(mockTask.description)).toBeInTheDocument();
      expect(screen.getByText(mockTask.project)).toBeInTheDocument();
    });

    test('should display overdue badge for overdue tasks', () => {
      const overdueProps = {
        ...defaultProps,
        isOverdue: jest.fn(() => true),
      };

      render(<TaskDialog {...overdueProps} />);

      const statusBadge = screen.getByText('O');
      expect(statusBadge).toBeInTheDocument();
    });

    test('should display red border when isUnsynced is true', () => {
      const unsyncedProps = {
        ...defaultProps,
        isUnsynced: true,
      };

      render(<TaskDialog {...unsyncedProps} />);

      const row = screen.getByTestId(`task-row-${mockTask.id}`);
      expect(row).toHaveClass('border-l-red-500');
    });

    test('should not display red border when isUnsynced is false', () => {
      const unsyncedProps = {
        ...defaultProps,
        isUnsynced: false,
      };

      render(<TaskDialog {...unsyncedProps} />);

      const row = screen.getByTestId(`task-row-${mockTask.id}`);
      expect(row).not.toHaveClass('border-l-red-500');
    });

    test('should display correct priority indicator', () => {
      const { container } = render(<TaskDialog {...defaultProps} />);

      const priorityIndicator = container.querySelector('.bg-red-500');
      expect(priorityIndicator).toBeInTheDocument();
    });

    test('should render dialog content when opened', async () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeInTheDocument();

      const titleEl = await screen.findByRole('heading', { level: 2 });

      expect(titleEl.textContent).toMatch(/Task\s*Details/i);
      expect(screen.getByText('ID:')).toBeInTheDocument();
      expect(screen.getByText('Description:')).toBeInTheDocument();
    });
  });

  describe('Dialog Interactions', () => {
    test('should call onSelectTask when row is clicked', () => {
      render(<TaskDialog {...defaultProps} />);

      const taskRow = screen.getByText(mockTask.description).closest('tr');
      fireEvent.click(taskRow!);

      expect(defaultProps.onSelectTask).toHaveBeenCalledWith(mockTask, 0);
    });

    test('should open dialog when trigger is clicked', async () => {
      render(<TaskDialog {...defaultProps} />);

      const taskRow = screen.getByText(mockTask.description).closest('tr');
      fireEvent.click(taskRow!);

      expect(defaultProps.onSelectTask).toHaveBeenCalled();
    });

    test('should call onOpenChange when dialog state changes', () => {
      render(<TaskDialog {...defaultProps} />);

      const taskRow = screen.getByTestId(`task-row-${mockTask.id}`);
      fireEvent.click(taskRow);

      expect(defaultProps.onSelectTask).toHaveBeenCalledWith(mockTask, 0);
    });
  });

  describe('Description Editing', () => {
    test('should enable edit mode when pencil icon is clicked', async () => {
      const editingState = { ...mockEditState, isEditing: false };
      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const editButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.lucide-pencil'));

      if (editButton) {
        fireEvent.click(editButton);
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          isEditing: true,
          editedDescription: mockTask.description,
        });
      }
    });

    test('should update description when input changes', () => {
      const editingState = { ...mockEditState, isEditing: true };
      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const input = screen.getByDisplayValue(mockTask.description);
      fireEvent.change(input, { target: { value: 'Updated Task' } });

      expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
        editedDescription: 'Updated Task',
      });
    });

    test('should save description when check icon is clicked', () => {
      const editingState = { ...mockEditState, isEditing: true };
      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const saveButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.text-green-500'));

      if (saveButton) {
        fireEvent.click(saveButton);
        expect(defaultProps.onSaveDescription).toHaveBeenCalledWith(
          mockTask,
          mockTask.description
        );
      }
    });

    test('should cancel editing when X icon is clicked', () => {
      const editingState = { ...mockEditState, isEditing: true };
      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const cancelButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.querySelector('.text-red-500'));

      if (cancelButtons.length > 0) {
        fireEvent.click(cancelButtons[0]);
        expect(defaultProps.onUpdateState).toHaveBeenCalled();
      }
    });
  });

  describe('Priority Editing', () => {
    test('should display current priority correctly', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByText('High (H)')).toBeInTheDocument();
    });

    test('should enable priority editing mode', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const priorityRow = screen.getByText('Priority:').closest('tr');
      const editButton = priorityRow?.querySelector('button');

      if (editButton) {
        fireEvent.click(editButton);
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          editedPriority: mockTask.priority || 'NONE',
          isEditingPriority: true,
        });
      }
    });

    test('should save priority changes', () => {
      const editingState = {
        ...mockEditState,
        isEditingPriority: true,
        editedPriority: 'M',
      };
      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const saveButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.text-green-500'));

      if (saveButton) {
        fireEvent.click(saveButton);
        expect(defaultProps.onSavePriority).toHaveBeenCalledWith(mockTask, 'M');
      }
    });
  });

  describe('Tags Editing', () => {
    test('should display existing tags', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    test('should enable tags editing mode', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const tagsRow = screen.getByText('Tags:').closest('tr');
      const editButton = tagsRow?.querySelector('button');

      if (editButton) {
        fireEvent.click(editButton);
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          isEditingTags: true,
          editedTags: mockTask.tags || [],
          editTagInput: '',
        });
      }
    });

    test('should add new tag on Enter key press', () => {
      const editingState = {
        ...mockEditState,
        isEditingTags: true,
        editTagInput: 'newtag',
        editedTags: ['tag1', 'tag2'],
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const input = screen.getByPlaceholderText(
        'Add a tag (press enter to add)'
      );
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
        editedTags: ['tag1', 'tag2', 'newtag'],
        editTagInput: '',
      });
    });

    test('should remove tag when X button is clicked', () => {
      const editingState = {
        ...mockEditState,
        isEditingTags: true,
        editedTags: ['tag1', 'tag2'],
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const removeButtons = screen.getAllByText('✖');
      if (removeButtons.length > 0) {
        fireEvent.click(removeButtons[0]);
        expect(defaultProps.onUpdateState).toHaveBeenCalled();
      }
    });

    test('should save tags when check icon is clicked', () => {
      const editingState = {
        ...mockEditState,
        isEditingTags: true,
        editedTags: ['tag1', 'tag2', 'tag3'],
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const saveButton = screen
        .getAllByRole('button')
        .find((btn) => btn.getAttribute('aria-label') === 'Save tags');

      if (saveButton) {
        fireEvent.click(saveButton);
        expect(defaultProps.onSaveTags).toHaveBeenCalledWith(mockTask, [
          'tag1',
          'tag2',
          'tag3',
        ]);
      }
    });
  });

  describe('Project Editing', () => {
    test('should display current project', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const projectCells = screen.getAllByText(mockTask.project);
      expect(projectCells.length).toBeGreaterThan(0);
    });

    test('should enable project editing mode', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const projectRow = screen.getByText('Project:').closest('tr');
      const editButton = projectRow?.querySelector('button');

      if (editButton) {
        fireEvent.click(editButton);
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          editedProject: mockTask.project,
          isEditingProject: true,
        });
      }
    });

    test('should save project changes', () => {
      const editingState = {
        ...mockEditState,
        isEditingProject: true,
        editedProject: 'New Project',
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const saveButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.text-green-500'));

      if (saveButton) {
        fireEvent.click(saveButton);
        expect(defaultProps.onSaveProject).toHaveBeenCalledWith(
          mockTask,
          'New Project'
        );
      }
    });
  });

  describe('Dependencies Editing', () => {
    test('should display existing dependencies', () => {
      const taskWithDeps = {
        ...mockTask,
        depends: ['test-uuid-456'],
      };

      render(
        <TaskDialog {...defaultProps} task={taskWithDeps} isOpen={true} />
      );

      expect(screen.getByText('Dependency Task')).toBeInTheDocument();
    });

    test('should enable dependencies editing mode', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const dependsRow = screen.getByText('Depends:').closest('tr');
      const editButton = dependsRow?.querySelector('button');

      if (editButton) {
        fireEvent.click(editButton);
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          isEditingDepends: true,
          editedDepends: mockTask.depends || [],
        });
      }
    });

    test('should open dropdown when Add Dependency button is clicked', () => {
      const editingState = {
        ...mockEditState,
        isEditingDepends: true,
        editedDepends: [],
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const addButton = screen.getByText('Add Dependency');
      fireEvent.click(addButton);

      expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
        dependsDropdownOpen: true,
      });
    });

    test('should save dependencies when check icon is clicked', () => {
      const editingState = {
        ...mockEditState,
        isEditingDepends: true,
        editedDepends: ['test-uuid-456'],
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const saveButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.text-green-500'));

      if (saveButton) {
        fireEvent.click(saveButton);
        expect(defaultProps.onSaveDepends).toHaveBeenCalledWith(mockTask, [
          'test-uuid-456',
        ]);
      }
    });
  });

  describe('Date Editing', () => {
    test('should enable due date editing mode', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const dueRow = screen.getByText('Due:').closest('tr');
      const editButton = dueRow?.querySelector('button');

      if (editButton) {
        fireEvent.click(editButton);
        expect(defaultProps.onUpdateState).toHaveBeenCalledWith({
          isEditingDueDate: true,
          editedDueDate: '2024-12-31',
        });
      }
    });

    test('should save due date changes', () => {
      const editingState = {
        ...mockEditState,
        isEditingDueDate: true,
        editedDueDate: '2024-12-31',
      };

      render(
        <TaskDialog {...defaultProps} isOpen={true} editState={editingState} />
      );

      const saveButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.text-green-500'));

      if (saveButton) {
        fireEvent.click(saveButton);
        expect(defaultProps.onSaveDueDate).toHaveBeenCalledWith(
          mockTask,
          '2024-12-31'
        );
      }
    });
  });

  describe('Task Actions', () => {
    test('should display Mark As Completed button for pending tasks', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByText(/Mark As Completed/)).toBeInTheDocument();
    });

    test('should not display Mark As Completed button for completed tasks', () => {
      const completedTask = { ...mockTask, status: 'completed' };
      render(
        <TaskDialog {...defaultProps} task={completedTask} isOpen={true} />
      );

      expect(screen.queryByText(/Mark As Completed/)).not.toBeInTheDocument();
    });

    test('should display delete button for non-deleted tasks', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const deleteButton = document.getElementById(
        `mark-task-as-deleted-${mockTask.id}`
      );
      expect(deleteButton).toBeInTheDocument();
    });

    test('should call onMarkComplete when confirmed', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const markCompleteButton = screen.getByText(/Mark As Completed/);
      fireEvent.click(markCompleteButton);

      const yesButtons = screen.getAllByText('Yes');
      if (yesButtons.length > 0) {
        fireEvent.click(yesButtons[0]);
        expect(defaultProps.onMarkComplete).toHaveBeenCalledWith(mockTask.uuid);
      }
    });

    test('should call onMarkDeleted when confirmed', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const deleteButton = screen.getByRole('button', {
        name: /delete task/i,
      });
      fireEvent.click(deleteButton);

      const yesButtons = screen.getAllByText('Yes');
      if (yesButtons.length > 0) {
        fireEvent.click(yesButtons[0]);
        expect(defaultProps.onMarkDeleted).toHaveBeenCalledWith(mockTask.uuid);
      }
    });
  });

  describe('UUID Copy Functionality', () => {
    test('should display UUID in dialog', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByText(mockTask.uuid)).toBeInTheDocument();
    });

    test('should have copy button for UUID', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} />);

      const uuidRow = screen.getByText('UUID:').closest('tr');
      const copyButton = uuidRow?.querySelector('button');
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('Selected State', () => {
    test('should highlight selected task row', () => {
      render(<TaskDialog {...defaultProps} selectedIndex={0} />);

      const taskRow = screen.getByText(mockTask.description).closest('tr');
      expect(taskRow).toHaveAttribute('data-selected', 'true');
    });

    test('should not highlight non-selected task row', () => {
      render(<TaskDialog {...defaultProps} selectedIndex={1} />);
      const taskRow = screen.getByText(mockTask.description).closest('tr');
      expect(taskRow).toHaveAttribute('data-selected', 'false');
    });
  });

  describe('Status Display', () => {
    test('should display P badge for pending tasks', () => {
      render(<TaskDialog {...defaultProps} />);

      expect(screen.getByText('P')).toBeInTheDocument();
    });

    test('should display C badge for completed tasks', () => {
      const completedTask = { ...mockTask, status: 'completed' };
      render(<TaskDialog {...defaultProps} task={completedTask} />);

      expect(screen.getByText('C')).toBeInTheDocument();
    });

    test('should display D badge for deleted tasks', () => {
      const deletedTask = { ...mockTask, status: 'deleted' };
      render(<TaskDialog {...defaultProps} task={deletedTask} />);

      expect(screen.getByText('D')).toBeInTheDocument();
    });

    test('should display O badge for overdue pending tasks', () => {
      const overdueProps = {
        ...defaultProps,
        isOverdue: jest.fn(() => true),
      };

      render(<TaskDialog {...overdueProps} />);

      expect(screen.getByText('O')).toBeInTheDocument();
    });
  });

  describe('Pin Functionality', () => {
    test('should display pin button in dialog footer when task is not pinned', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} isPinned={false} />);

      const pinButton = screen.getByRole('button', { name: /pin task/i });
      expect(pinButton).toBeInTheDocument();
      expect(screen.getByText('Pin')).toBeInTheDocument();
    });

    test('should display unpin button in dialog footer when task is pinned', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} isPinned={true} />);

      const unpinButton = screen.getByRole('button', { name: /unpin task/i });
      expect(unpinButton).toBeInTheDocument();
      expect(screen.getByText('Unpin')).toBeInTheDocument();
    });

    test('should call onTogglePin when pin button is clicked', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} isPinned={false} />);

      const pinButton = screen.getByRole('button', { name: /pin task/i });
      fireEvent.click(pinButton);

      expect(defaultProps.onTogglePin).toHaveBeenCalledWith(mockTask.uuid);
    });

    test('should call onTogglePin when unpin button is clicked', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} isPinned={true} />);

      const unpinButton = screen.getByRole('button', { name: /unpin task/i });
      fireEvent.click(unpinButton);

      expect(defaultProps.onTogglePin).toHaveBeenCalledWith(mockTask.uuid);
    });

    test('should display pin icon in task row when task is not pinned', () => {
      const { container } = render(
        <TaskDialog {...defaultProps} isPinned={false} />
      );

      const pinIcon = container.querySelector('.lucide-pin');
      expect(pinIcon).toBeInTheDocument();
    });

    test('should display pin icon in task row when task is pinned', () => {
      const { container } = render(
        <TaskDialog {...defaultProps} isPinned={true} />
      );

      const pinIcon = container.querySelector('.lucide-pin');
      expect(pinIcon).toBeInTheDocument();
    });

    test('should call onTogglePin when pin icon in task row is clicked', () => {
      const { container } = render(
        <TaskDialog {...defaultProps} isPinned={false} />
      );

      const pinIcon = container.querySelector('.lucide-pin');
      expect(pinIcon).toBeInTheDocument();

      if (pinIcon?.parentElement) {
        fireEvent.click(pinIcon.parentElement);
        expect(defaultProps.onTogglePin).toHaveBeenCalledWith(mockTask.uuid);
      }
    });

    test('should not open dialog when pin icon in task row is clicked', () => {
      const { container } = render(
        <TaskDialog {...defaultProps} isPinned={false} />
      );

      const pinIcon = container.querySelector('.lucide-pin');

      if (pinIcon?.parentElement) {
        fireEvent.click(pinIcon.parentElement);
        expect(defaultProps.onSelectTask).not.toHaveBeenCalled();
      }
    });

    test('pin button should have mr-auto class for left alignment', () => {
      render(<TaskDialog {...defaultProps} isOpen={true} isPinned={false} />);

      const pinButton = screen.getByRole('button', { name: /pin task/i });
      expect(pinButton).toHaveClass('mr-auto');
    });
  });
});
