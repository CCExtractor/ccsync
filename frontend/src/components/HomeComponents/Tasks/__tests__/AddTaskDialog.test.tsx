import { render, screen, fireEvent } from '@testing-library/react';
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
          value={value || ''}
          onChange={(e) => onValueChange?.(e.target.value)}
        >
          {children}
        </select>
      );
    },
    SelectTrigger: ({ children, 'data-testid': dataTestId, ...props }: any) => (
      <div data-testid={dataTestId} {...props}>
        {children}
      </div>
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

    expect(screen.getByText(/fill in the details below/i)).toBeInTheDocument();
  });

  test('updates description when user types in input field', () => {
    mockProps.isOpen = true;
    render(<AddTaskdialog {...mockProps} />);

    const descriptionInput = screen.getByLabelText(/description/i);

    fireEvent.change(descriptionInput, { target: { value: 'Buy groceries' } });

    expect(mockProps.setNewTask).toHaveBeenCalledWith({
      ...mockProps.newTask,
      description: 'Buy groceries',
    });
  });

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

  test('does not add empty tag when tagInput is empty', () => {
    mockProps.isOpen = true;
    mockProps.tagInput = '';
    render(<AddTaskdialog {...mockProps} />);

    const tagsInput = screen.getByPlaceholderText(/add a tag/i);
    fireEvent.keyDown(tagsInput, { key: 'Enter', code: 'Enter' });

    expect(mockProps.setNewTask).not.toHaveBeenCalled();
  });

  test('updates tagInput when user types in tag field', () => {
    mockProps.isOpen = true;
    render(<AddTaskdialog {...mockProps} />);

    const tagsInput = screen.getByPlaceholderText(/add a tag/i);
    fireEvent.change(tagsInput, { target: { value: 'new-tag' } });

    expect(mockProps.setTagInput).toHaveBeenCalledWith('new-tag');
  });

  test('renders all priority options in dropdown', () => {
    mockProps.isOpen = true;
    render(<AddTaskdialog {...mockProps} />);

    const prioritySelect = screen.getByLabelText(/priority/i);

    expect(prioritySelect).toContainHTML('<option value="H">H</option>');
    expect(prioritySelect).toContainHTML('<option value="M">M</option>');
    expect(prioritySelect).toContainHTML('<option value="L">L</option>');
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

  describe('Task Dependencies', () => {
    beforeEach(() => {
      mockProps.isOpen = true;
      mockProps.allTasks = [
        {
          id: 1,
          uuid: 'task-1',
          description: 'First task',
          status: 'pending',
          project: 'Project A',
          tags: [],
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
  });

  test('renders wait date picker with correct placeholder', () => {
    mockProps.isOpen = true;
    render(<AddTaskdialog {...mockProps} />);

    const waitDatePicker = screen.getByPlaceholderText(/select a wait date/i);
    expect(waitDatePicker).toBeInTheDocument();
  });

  test('updates wait when user selects a date', () => {
    mockProps.isOpen = true;
    render(<AddTaskdialog {...mockProps} />);

    const waitDatePicker = screen.getByPlaceholderText(/select a wait date/i);
    fireEvent.change(waitDatePicker, { target: { value: '2025-12-20' } });

    expect(mockProps.setNewTask).toHaveBeenCalledWith({
      ...mockProps.newTask,
      wait: '2025-12-20',
    });
  });

  test('submits task with wait date when provided', () => {
    mockProps.isOpen = true;
    mockProps.newTask.wait = '2025-12-20';
    render(<AddTaskdialog {...mockProps} />);

    const submitButton = screen.getByRole('button', {
      name: /add task/i,
    });
    fireEvent.click(submitButton);

    expect(mockProps.onSubmit).toHaveBeenCalledWith(mockProps.newTask);
  });

  test('allows empty wait date (optional field)', () => {
    mockProps.isOpen = true;
    mockProps.newTask.wait = '';
    render(<AddTaskdialog {...mockProps} />);

    const submitButton = screen.getByRole('button', {
      name: /add task/i,
    });
    fireEvent.click(submitButton);

    expect(mockProps.onSubmit).toHaveBeenCalledWith(mockProps.newTask);
  });

  test('renders entry date picker with correct placeholder', () => {
    mockProps.isOpen = true;
    render(<AddTaskdialog {...mockProps} />);

    const entryDatePicker =
      screen.getByPlaceholderText(/select an entry date/i);
    expect(entryDatePicker).toBeInTheDocument();
  });

  test('updates entry when user selects a date', () => {
    mockProps.isOpen = true;
    render(<AddTaskdialog {...mockProps} />);

    const entryDatePicker =
      screen.getByPlaceholderText(/select an entry date/i);
    fireEvent.change(entryDatePicker, { target: { value: '2025-12-20' } });

    expect(mockProps.setNewTask).toHaveBeenCalledWith({
      ...mockProps.newTask,
      entry: '2025-12-20',
    });
  });

  test('submits task with entry date when provided', () => {
    mockProps.isOpen = true;
    mockProps.newTask = {
      description: 'Test task',
      priority: 'H',
      project: 'Work',
      due: '2024-12-25',
      start: '',
      entry: '2025-12-20',
      tags: ['urgent'],
      annotations: [],
      depends: [],
    };
    render(<AddTaskdialog {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(submitButton);

    expect(mockProps.onSubmit).toHaveBeenCalledWith(mockProps.newTask);
  });

  test('allows empty entry date (optional field)', () => {
    mockProps.isOpen = true;
    mockProps.newTask = {
      description: 'Test task',
      priority: 'M',
      project: '',
      due: '',
      start: '',
      entry: '',
      tags: [],
      annotations: [],
      depends: [],
    };
    render(<AddTaskdialog {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(submitButton);

    expect(mockProps.onSubmit).toHaveBeenCalledWith(mockProps.newTask);
  });
});
