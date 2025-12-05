import { render, screen, fireEvent } from '@testing-library/react';
import { AddTaskdialog } from '../AddTaskDialog';
import '@testing-library/jest-dom';

jest.mock('date-fns', () => ({
  format: jest.fn(() => '2024-12-25'),
}));

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
        tags: [],
      },
      setNewTask: jest.fn(),
      tagInput: '',
      setTagInput: jest.fn(),
      onSubmit: jest.fn(),
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

  test('updates project when user types in project field', () => {
    mockProps.isOpen = true;
    render(<AddTaskdialog {...mockProps} />);

    const projectInput = screen.getByLabelText(/project/i);

    fireEvent.change(projectInput, { target: { value: 'Work' } });

    expect(mockProps.setNewTask).toHaveBeenCalledWith({
      ...mockProps.newTask,
      project: 'Work',
    });
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
      tags: ['urgent'],
    };
    render(<AddTaskdialog {...mockProps} />);

    const submitButton = screen.getByRole('button', {
      name: /add task/i,
      hidden: false,
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
});
