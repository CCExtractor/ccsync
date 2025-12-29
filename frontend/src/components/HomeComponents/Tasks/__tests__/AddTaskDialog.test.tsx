import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddTaskdialog } from '../AddTaskDialog';
import '@testing-library/jest-dom';

jest.mock('date-fns', () => ({
  format: jest.fn((date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }),
}));

jest.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({ onDateChange, placeholder }: any) => (
    <input
      data-testid="date-picker"
      placeholder={placeholder}
      onChange={(e) => {
        if (e.target.value) {
          onDateChange(new Date(e.target.value));
        } else {
          onDateChange(null);
        }
      }}
    />
  ),
}));

jest.mock('@/components/ui/date-time-picker', () => ({
  DateTimePicker: ({ onDateTimeChange, placeholder }: any) => (
    <input
      data-testid="date-time-picker"
      placeholder={placeholder}
      onChange={(e) => {
        if (e.target.value) {
          const date = new Date(e.target.value);
          // Simulate hasTime based on whether time is provided
          const hasTime =
            e.target.value.includes('T') && e.target.value.includes(':');
          onDateTimeChange(date, hasTime);
        } else {
          onDateTimeChange(null, false);
        }
      }}
    />
  ),
}));

jest.mock('@/components/ui/select', () => {
  return {
    Select: ({ children, onValueChange, value }: any) => {
      // Create a simple select element that calls onValueChange when changed
      return (
        <select
          data-testid="project-select"
          value={value || ''}
          onChange={(e) => onValueChange?.(e.target.value)}
        >
          {children}
        </select>
      );
    },
    SelectTrigger: ({ children, 'data-testid': dataTestId, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    SelectValue: ({ placeholder }: any) => (
      <option value="" disabled>
        {placeholder}
      </option>
    ),
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ value, children, ...props }: any) => (
      <option value={value} {...props}>
        {children}
      </option>
    ),
  };
});

describe('AddTaskDialog Component', () => {
  let mockProps: any;

  beforeEach(() => {
    mockProps = {
      isOpen: false,
      setIsOpen: jest.fn(),
      newTask: {
        description: '',
        priority: 'M',
        project: '',
        due: '',
        start: '',
        entry: '',
        wait: '',
        end: '',
        recur: '',
        tags: [],
        annotations: [],
        depends: [],
      },
      setNewTask: jest.fn(),
      tagInput: '',
      setTagInput: jest.fn(),
      onSubmit: jest.fn(),
      uniqueProjects: [],
      allTasks: [],
      isCreatingNewProject: false,
      setIsCreatingNewProject: jest.fn(),
    };
  });

  describe('Dialog', () => {
    test('renders the "Add Task" button', () => {
      render(<AddTaskdialog {...mockProps} />);

      const addButton = screen.getByRole('button', { name: /add task/i });

      expect(addButton).toBeInTheDocument();
    });

    test('opens dialog when "Add Task" button is clicked', () => {
      render(<AddTaskdialog {...mockProps} />);

      const addButton = screen.getByRole('button', { name: /add task/i });
      fireEvent.click(addButton);

      expect(mockProps.setIsOpen).toHaveBeenCalledWith(true);
    });

    test('displays dialog content when isOpen is true', () => {
      mockProps.isOpen = true;
      render(<AddTaskdialog {...mockProps} />);

      expect(
        screen.getByText(/fill in the details below/i)
      ).toBeInTheDocument();
    });

    test('closes dialog when Cancel button is clicked', () => {
      mockProps.isOpen = true;
      render(<AddTaskdialog {...mockProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockProps.setIsOpen).toHaveBeenCalledWith(false);
    });

    test('calls onSubmit when "Add Task" button in dialog is clicked', () => {
      mockProps.isOpen = true;
      mockProps.newTask = {
        description: 'Test task',
        priority: 'H',
        project: 'Work',
        due: '2024-12-25',
        start: '',
        entry: '2025-12-20',
        wait: '2025-12-20',
        end: '',
        recur: '',
        tags: ['urgent'],
        annotations: [],
        depends: [],
      };
      render(<AddTaskdialog {...mockProps} />);

      const submitButton = screen.getByRole('button', {
        name: /add task/i,
      });

      expect(submitButton).toBeInTheDocument();
      fireEvent.click(submitButton);
      expect(mockProps.onSubmit).toHaveBeenCalledWith(mockProps.newTask);
    });
  });

  describe('Description Field', () => {
    test('updates description when user types in input field', () => {
      mockProps.isOpen = true;
      render(<AddTaskdialog {...mockProps} />);

      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(descriptionInput, {
        target: { value: 'Buy groceries' },
      });

      expect(mockProps.setNewTask).toHaveBeenCalledWith({
        ...mockProps.newTask,
        description: 'Buy groceries',
      });
    });
  });

  describe('Priority Field', () => {
    test('updates priority when user selects from dropdown', () => {
      mockProps.isOpen = true;
      render(<AddTaskdialog {...mockProps} />);

      const prioritySelect = screen.getByLabelText(/priority/i);

      fireEvent.change(prioritySelect, { target: { value: 'H' } });

      expect(mockProps.setNewTask).toHaveBeenCalledWith({
        ...mockProps.newTask,
        priority: 'H',
      });
    });

    test('renders all priority options in dropdown', () => {
      mockProps.isOpen = true;
      render(<AddTaskdialog {...mockProps} />);

      const prioritySelect = screen.getByLabelText(/priority/i);

      expect(prioritySelect).toContainHTML('<option value="H">H</option>');
      expect(prioritySelect).toContainHTML('<option value="M">M</option>');
      expect(prioritySelect).toContainHTML('<option value="L">L</option>');
    });
  });

  describe('Project Field', () => {
    test('updates project when user types in project field', async () => {
      mockProps.isOpen = true;
      mockProps.isCreatingNewProject = true;
      mockProps.newTask = { ...mockProps.newTask, project: '' };

      render(<AddTaskdialog {...mockProps} />);

      const newProjectInput =
        await screen.findByPlaceholderText('New project name');
      fireEvent.change(newProjectInput, { target: { value: 'Work' } });

      expect(mockProps.setNewTask).toHaveBeenCalledWith({
        ...mockProps.newTask,
        project: 'Work',
      });
    });

    test('displays project select with unique projects', () => {
      mockProps.isOpen = true;
      mockProps.uniqueProjects = ['Work', 'Personal'];
      render(<AddTaskdialog {...mockProps} />);

      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    test('shows new project input when creating new project', () => {
      mockProps.isOpen = true;
      mockProps.isCreatingNewProject = true;
      render(<AddTaskdialog {...mockProps} />);

      const projectInput = screen.getByPlaceholderText(/new project name/i);
      expect(projectInput).toBeInTheDocument();
    });

    test('updates project name when typing in new project input', () => {
      mockProps.isOpen = true;
      mockProps.isCreatingNewProject = true;
      render(<AddTaskdialog {...mockProps} />);

      const projectInput = screen.getByPlaceholderText(/new project name/i);
      fireEvent.change(projectInput, { target: { value: 'New Project' } });

      expect(mockProps.setNewTask).toHaveBeenCalledWith({
        ...mockProps.newTask,
        project: 'New Project',
      });
    });

    test('sets isCreatingNewProject to true when "create new project" is selected', () => {
      mockProps.isOpen = true;
      mockProps.uniqueProjects = ['Work', 'Personal'];
      render(<AddTaskdialog {...mockProps} />);

      const projectSelect = screen.getByTestId('project-select');
      fireEvent.change(projectSelect, { target: { value: '__CREATE_NEW__' } });

      expect(mockProps.setIsCreatingNewProject).toHaveBeenCalledWith(true);
      expect(mockProps.setNewTask).toHaveBeenCalledWith({
        ...mockProps.newTask,
        project: '',
      });
    });

    test('sets isCreatingNewProject to false when existing project is selected', () => {
      mockProps.isOpen = true;
      mockProps.uniqueProjects = ['Work', 'Personal'];
      render(<AddTaskdialog {...mockProps} />);

      const projectSelect = screen.getByTestId('project-select');
      fireEvent.change(projectSelect, { target: { value: 'Work' } });

      expect(mockProps.setIsCreatingNewProject).toHaveBeenCalledWith(false);
      expect(mockProps.setNewTask).toHaveBeenCalledWith({
        ...mockProps.newTask,
        project: 'Work',
      });
    });
  });

  describe('Tags', () => {
    test('adds a tag when user types and presses Enter', () => {
      mockProps.isOpen = true;
      mockProps.tagInput = 'urgent';
      render(<AddTaskdialog {...mockProps} />);

      const tagsInput = screen.getByPlaceholderText(/add a tag/i);

      fireEvent.keyDown(tagsInput, { key: 'Enter', code: 'Enter' });

      expect(mockProps.setNewTask).toHaveBeenCalledWith({
        ...mockProps.newTask,
        tags: ['urgent'],
      });

      expect(mockProps.setTagInput).toHaveBeenCalledWith('');
    });

    test('does not add duplicate tags', () => {
      mockProps.isOpen = true;
      mockProps.tagInput = 'urgent';
      mockProps.newTask.tags = ['urgent'];
      render(<AddTaskdialog {...mockProps} />);

      const tagsInput = screen.getByPlaceholderText(/add a tag/i);
      fireEvent.keyDown(tagsInput, { key: 'Enter', code: 'Enter' });

      expect(mockProps.setNewTask).not.toHaveBeenCalled();
    });

    test('removes a tag when user clicks the remove button', () => {
      mockProps.isOpen = true;
      mockProps.newTask.tags = ['urgent', 'important'];
      render(<AddTaskdialog {...mockProps} />);

      const removeButtons = screen.getAllByText('✖');

      fireEvent.click(removeButtons[0]);

      expect(mockProps.setNewTask).toHaveBeenCalledWith({
        ...mockProps.newTask,
        tags: ['important'],
      });
    });

    test('displays tags as badges', () => {
      mockProps.isOpen = true;
      mockProps.newTask.tags = ['urgent', 'work'];
      render(<AddTaskdialog {...mockProps} />);

      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.getByText('work')).toBeInTheDocument();
    });

    test('updates tagInput when user types in tag field', () => {
      mockProps.isOpen = true;
      render(<AddTaskdialog {...mockProps} />);

      const tagsInput = screen.getByPlaceholderText(/add a tag/i);
      fireEvent.change(tagsInput, { target: { value: 'new-tag' } });

      expect(mockProps.setTagInput).toHaveBeenCalledWith('new-tag');
    });

    test('does not add empty tag when tagInput is empty', () => {
      mockProps.isOpen = true;
      mockProps.tagInput = '';
      render(<AddTaskdialog {...mockProps} />);

      const tagsInput = screen.getByPlaceholderText(/add a tag/i);
      fireEvent.keyDown(tagsInput, { key: 'Enter', code: 'Enter' });

      expect(mockProps.setNewTask).not.toHaveBeenCalled();
    });
  });

  describe('Date Fields', () => {
    const dateFields = [
      { name: 'due', label: 'Due', placeholder: 'Select due date and time' },
      {
        name: 'start',
        label: 'Start',
        placeholder: 'Select start date and time',
      },
      { name: 'end', label: 'End', placeholder: 'Select end date and time' },
      {
        name: 'entry',
        label: 'Entry',
        placeholder: 'Select entry date and time',
      },
      { name: 'wait', label: 'Wait', placeholder: 'Select wait date and time' },
    ];

    test.each(dateFields)(
      'renders $name date-time picker with correct placeholder',
      ({ placeholder }) => {
        mockProps.isOpen = true;
        render(<AddTaskdialog {...mockProps} />);

        const dateTimePicker = screen.getByPlaceholderText(placeholder);
        expect(dateTimePicker).toBeInTheDocument();
      }
    );

    test.each(dateFields)(
      'updates $name when user selects a date only (no time)',
      ({ name, placeholder }) => {
        mockProps.isOpen = true;
        render(<AddTaskdialog {...mockProps} />);

        const dateTimePicker = screen.getByPlaceholderText(placeholder);
        // Simulate date-only selection (no T in value)
        fireEvent.change(dateTimePicker, { target: { value: '2025-12-25' } });

        expect(mockProps.setNewTask).toHaveBeenCalledWith({
          ...mockProps.newTask,
          [name]: '2025-12-25',
        });
      }
    );

    test.each(dateFields)(
      'updates $name when user selects a date with time',
      ({ name, placeholder }) => {
        mockProps.isOpen = true;
        render(<AddTaskdialog {...mockProps} />);

        const dateTimePicker = screen.getByPlaceholderText(placeholder);
        // Simulate datetime selection (with T in value)
        fireEvent.change(dateTimePicker, {
          target: { value: '2025-12-25T14:30:00.000Z' },
        });

        // Should call with ISO string when hasTime is true
        expect(mockProps.setNewTask).toHaveBeenCalled();
        const callArgs = mockProps.setNewTask.mock.calls[0][0];
        expect(callArgs[name]).toContain('T');
      }
    );

    test.each(dateFields)(
      'allows empty $name date (optional field)',
      ({ name, placeholder }) => {
        mockProps.isOpen = true;
        render(<AddTaskdialog {...mockProps} />);

        const dateTimePicker = screen.getByPlaceholderText(placeholder);

        fireEvent.change(dateTimePicker, { target: { value: '2025-12-25' } });
        mockProps.setNewTask.mockClear();
        fireEvent.change(dateTimePicker, { target: { value: '' } });

        expect(mockProps.setNewTask).toHaveBeenCalledWith({
          ...mockProps.newTask,
          [name]: '',
        });
      }
    );

    test.each(dateFields)(
      'submits task with $name date when provided',
      ({ name }) => {
        mockProps.isOpen = true;
        mockProps.newTask = {
          ...mockProps.newTask,
          [name]: '2025-12-25',
        };
        render(<AddTaskdialog {...mockProps} />);

        const submitButton = screen.getByRole('button', { name: /add task/i });
        fireEvent.click(submitButton);

        expect(mockProps.onSubmit).toHaveBeenCalledWith(mockProps.newTask);
      }
    );
  });

  describe('Depends Field', () => {
    beforeEach(() => {
      mockProps.isOpen = true;
      mockProps.allTasks = [
        {
          id: 1,
          uuid: 'task-1',
          description: 'First task',
          status: 'pending',
          project: 'Project A',
          tags: ['urgent'],
          priority: 'M',
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
          urgency: 0,
        },
        {
          id: 2,
          uuid: 'task-2',
          description: 'Second task',
          status: 'pending',
          project: 'Project B',
          tags: [],
          priority: 'H',
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
          urgency: 0,
        },
      ];
    });

    test('renders dependency search field', () => {
      render(<AddTaskdialog {...mockProps} />);

      expect(screen.getByText('Depends On')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          'Search and select tasks this depends on...'
        )
      ).toBeInTheDocument();
    });

    test('displays selected dependencies as badges', () => {
      mockProps.newTask.depends = ['task-1'];
      render(<AddTaskdialog {...mockProps} />);

      expect(screen.getByText('#1 First task')).toBeInTheDocument();
    });

    test('removes dependency when remove button is clicked', () => {
      mockProps.newTask.depends = ['task-1'];
      render(<AddTaskdialog {...mockProps} />);

      const removeButton = screen.getByText('✖');
      fireEvent.click(removeButton);

      expect(mockProps.setNewTask).toHaveBeenCalledWith({
        ...mockProps.newTask,
        depends: [],
      });
    });

    test('shows message when no tasks found', () => {
      mockProps.allTasks = [];
      render(<AddTaskdialog {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(
        'Search and select tasks this depends on...'
      );
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(
        screen.getByText('No tasks found matching your search')
      ).toBeInTheDocument();
    });

    test('includes dependencies in task submission', () => {
      mockProps.newTask = {
        description: 'Test task with dependency',
        priority: 'H',
        project: 'Work',
        due: '2024-12-25',
        start: '',
        tags: [],
        annotations: [],
        depends: ['task-1'],
      };
      render(<AddTaskdialog {...mockProps} />);

      const submitButton = screen.getByRole('button', {
        name: /add task/i,
      });
      fireEvent.click(submitButton);

      expect(mockProps.onSubmit).toHaveBeenCalledWith(mockProps.newTask);
    });

    test('filters tasks by project name', () => {
      render(<AddTaskdialog {...mockProps} />);
      const searchInput = screen.getByPlaceholderText(
        'Search and select tasks this depends on...'
      );

      fireEvent.change(searchInput, { target: { value: 'Project A' } });

      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(screen.queryByText('Second task')).not.toBeInTheDocument();
    });

    test('filters tasks by tag name', () => {
      render(<AddTaskdialog {...mockProps} />);
      const searchInput = screen.getByPlaceholderText(
        'Search and select tasks this depends on...'
      );

      fireEvent.change(searchInput, { target: { value: 'urgent' } });

      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    test('shows no results when search is empty', () => {
      render(<AddTaskdialog {...mockProps} />);
      const searchInput = screen.getByPlaceholderText(
        'Search and select tasks this depends on...'
      );

      fireEvent.change(searchInput, { target: { value: '   ' } });

      expect(screen.queryByText('First task')).not.toBeInTheDocument();
      expect(screen.queryByText('Second task')).not.toBeInTheDocument();
    });

    test('adds dependency when search result is clicked', () => {
      render(<AddTaskdialog {...mockProps} />);
      const searchInput = screen.getByPlaceholderText(
        'Search and select tasks this depends on...'
      );
      fireEvent.change(searchInput, { target: { value: 'First' } });
      const taskResult = screen.getByText('First task');

      fireEvent.click(taskResult);

      expect(mockProps.setNewTask).toHaveBeenCalledWith({
        ...mockProps.newTask,
        depends: ['task-1'],
      });
    });

    test('shows results when input is focused with existing text', () => {
      render(<AddTaskdialog {...mockProps} />);
      const searchInput = screen.getByPlaceholderText(
        'Search and select tasks this depends on...'
      );

      fireEvent.change(searchInput, { target: { value: 'First' } });
      fireEvent.focus(searchInput);

      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    test('returns no filtered tasks when search is empty', () => {
      render(<AddTaskdialog {...mockProps} />);
      const searchInput = screen.getByPlaceholderText(
        'Search and select tasks this depends on...'
      );

      fireEvent.focus(searchInput);

      expect(screen.queryByText('First task')).not.toBeInTheDocument();
    });

    test('hides results when input loses focus', async () => {
      render(<AddTaskdialog {...mockProps} />);
      const searchInput = screen.getByPlaceholderText(
        'Search and select tasks this depends on...'
      );

      fireEvent.change(searchInput, { target: { value: 'First' } });
      expect(screen.getByText('First task')).toBeInTheDocument();

      fireEvent.blur(searchInput);

      // Wait for the 200ms timeout to complete
      await waitFor(
        () => {
          expect(screen.queryByText('First task')).not.toBeInTheDocument();
        },
        { timeout: 300 }
      );
    });
  });

  describe('Annotations Field', () => {
    const annotation1 = {
      entry: '2025-12-25T00:00:00Z',
      description: 'First note',
    };
    const annotation2 = {
      entry: '2025-12-25T00:00:00Z',
      description: 'Second note',
    };

    test('renders annotations input field', () => {
      mockProps.isOpen = true;
      render(<AddTaskdialog {...mockProps} />);

      const annotationsInput = screen.getByPlaceholderText('Add an annotation');
      expect(annotationsInput).toBeInTheDocument();
    });

    test('adds annotation when user types and presses enter', () => {
      mockProps.isOpen = true;
      render(<AddTaskdialog {...mockProps} />);

      const annotationsInput = screen.getByPlaceholderText('Add an annotation');
      fireEvent.change(annotationsInput, {
        target: { value: 'This is an annotation' },
      });
      fireEvent.keyDown(annotationsInput, { key: 'Enter', code: 'Enter' });

      expect(mockProps.setNewTask).toHaveBeenCalledWith({
        ...mockProps.newTask,
        annotations: [
          expect.objectContaining({ description: 'This is an annotation' }),
        ],
      });
    });

    test('does not add empty annotation', () => {
      mockProps.isOpen = true;
      render(<AddTaskdialog {...mockProps} />);

      const annotationsInput = screen.getByPlaceholderText('Add an annotation');
      fireEvent.change(annotationsInput, { target: { value: '' } });
      fireEvent.keyDown(annotationsInput, { key: 'Enter', code: 'Enter' });

      expect(mockProps.setNewTask).not.toHaveBeenCalled();
    });

    test('does not add whitespace-only annotation', () => {
      mockProps.isOpen = true;
      render(<AddTaskdialog {...mockProps} />);

      const annotationsInput = screen.getByPlaceholderText('Add an annotation');
      fireEvent.change(annotationsInput, { target: { value: '      ' } });
      fireEvent.keyDown(annotationsInput, { key: 'Enter', code: 'Enter' });

      expect(mockProps.setNewTask).not.toHaveBeenCalled();
    });

    test('displays annotations as badges', () => {
      mockProps.isOpen = true;
      mockProps.newTask.annotations = [annotation1, annotation2];
      render(<AddTaskdialog {...mockProps} />);

      expect(screen.getByText('First note')).toBeInTheDocument();
      expect(screen.getByText('Second note')).toBeInTheDocument();
    });

    test('removes annotation when user clicks remove button', () => {
      mockProps.isOpen = true;
      mockProps.newTask.annotations = [annotation1, annotation2];
      render(<AddTaskdialog {...mockProps} />);

      const removeButtons = screen.getAllByRole('button', {
        name: 'remove annotation',
      });
      fireEvent.click(removeButtons[0]);

      expect(mockProps.setNewTask).toHaveBeenCalledWith({
        ...mockProps.newTask,
        annotations: [annotation2],
      });
    });
  });

  describe('Recur Field', () => {
    test('renders recur dropdown with all options', () => {
      mockProps.isOpen = true;
      render(<AddTaskdialog {...mockProps} />);

      const recurSelect = screen.getByLabelText('Recur');

      expect(recurSelect).toContainHTML('<option value="">None</option>');
      expect(recurSelect).toContainHTML('<option value="daily">Daily</option>');
      expect(recurSelect).toContainHTML(
        '<option value="weekly">Weekly</option>'
      );
      expect(recurSelect).toContainHTML(
        '<option value="monthly">Monthly</option>'
      );
      expect(recurSelect).toContainHTML(
        '<option value="yearly">Yearly</option>'
      );
    });

    test('updates recur when user selects from dropdown', () => {
      mockProps.isOpen = true;
      render(<AddTaskdialog {...mockProps} />);

      const recurSelect = screen.getByLabelText('Recur');
      fireEvent.change(recurSelect, { target: { value: 'weekly' } });

      expect(mockProps.setNewTask).toHaveBeenCalledWith({
        ...mockProps.newTask,
        recur: 'weekly',
      });
    });

    test('allows no recur selection', () => {
      mockProps.isOpen = true;
      render(<AddTaskdialog {...mockProps} />);

      const recurSelect = screen.getByLabelText('Recur');
      fireEvent.change(recurSelect, { target: { value: '' } });

      expect(mockProps.setNewTask).toHaveBeenCalledWith({
        ...mockProps.newTask,
        recur: '',
      });
    });
  });
});
