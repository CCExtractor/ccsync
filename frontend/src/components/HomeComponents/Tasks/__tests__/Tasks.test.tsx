import {
  render,
  screen,
  fireEvent,
  act,
  within,
  waitFor,
} from '@testing-library/react';
import { Tasks } from '../Tasks';

// Mock props for the Tasks component
const mockProps = {
  origin: '',
  email: 'test@example.com',
  encryptionSecret: 'mockEncryptionSecret',
  UUID: 'mockUUID',
  isLoading: false, // mock the loading state
  setIsLoading: jest.fn(), // mock the setter function
};

// Mock functions and modules
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../tasks-utils', () => {
  const originalModule = jest.requireActual('../tasks-utils');
  return {
    ...originalModule, // Includes all real functions like sortTasksById
    markTaskAsCompleted: jest.fn(),
    markTaskAsDeleted: jest.fn(),
    getTimeSinceLastSync: jest
      .fn()
      .mockReturnValue('Last updated 5 minutes ago'),
    hashKey: jest.fn().mockReturnValue('mockHashedKey'),
  };
});

jest.mock('@/components/ui/multi-select', () => ({
  MultiSelectFilter: jest.fn(({ title }) => (
    <div>Mocked MultiSelect: {title}</div>
  )),
}));

jest.mock('@/components/ui/select', () => {
  return {
    Select: ({ children, onValueChange, value }: any) => (
      <select
        data-testid="project-select"
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        {children}
      </select>
    ),
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: ({ placeholder }: any) => (
      <option value="" disabled hidden>
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

jest.mock('../../BottomBar/BottomBar', () => {
  return jest.fn(() => <div>Mocked BottomBar</div>);
});

jest.mock('../hooks', () => ({
  TasksDatabase: jest.fn(() => ({
    tasks: {
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          // Mock 12 tasks to test pagination
          toArray: jest.fn().mockResolvedValue([
            ...Array.from({ length: 12 }, (_, i) => ({
              id: i + 1,
              description: `Task ${i + 1}`,
              status: 'pending',
              project: i % 2 === 0 ? 'ProjectA' : 'ProjectB',
              tags: i % 3 === 0 ? ['tag1'] : ['tag2'],
              uuid: `uuid-${i + 1}`,
              due: i === 0 ? '20200101T120000Z' : undefined,
            })),
            {
              id: 13,
              description:
                'Prepare quarterly financial analysis report for review',
              status: 'pending',
              project: 'Finance',
              tags: ['report', 'analysis'],
              uuid: 'uuid-corp-1',
            },
            {
              id: 14,
              description: 'Schedule client onboarding meeting with Sales team',
              status: 'pending',
              project: 'Sales',
              tags: ['meeting', 'client'],
              uuid: 'uuid-corp-2',
            },
            {
              id: 15,
              description:
                'Draft technical documentation for API integration module',
              status: 'pending',
              project: 'Engineering',
              tags: ['documentation', 'api'],
              uuid: 'uuid-corp-3',
            },
          ]),
        })),
      })),
    },
  })),
  fetchTaskwarriorTasks: jest.fn().mockResolvedValue([]),
  addTaskToBackend: jest.fn().mockResolvedValue({}),
  editTaskOnBackend: jest.fn().mockResolvedValue({}),
}));

jest.mock('../Pagination', () => {
  return jest.fn((props) => (
    <div data-testid="mock-pagination">
      {/* Render props to make them testable */}
      <span data-testid="total-pages">{props.totalPages}</span>
      <span data-testid="current-page">{props.currentPage}</span>
    </div>
  ));
});

global.fetch = jest.fn().mockResolvedValue({ ok: true });

describe('Tasks Component', () => {
  const localStorageMock = (() => {
    let store: { [key: string]: string } = {};
    return {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('renders tasks component and the mocked BottomBar', async () => {
    render(<Tasks {...mockProps} />);
    expect(screen.getByTestId('tasks')).toBeInTheDocument();
    expect(screen.getByText('Mocked BottomBar')).toBeInTheDocument();
  });

  test('renders the "Tasks per Page" dropdown with default value', async () => {
    await act(async () => {
      render(<Tasks {...mockProps} />);
    });

    expect(await screen.findByText('Task 12')).toBeInTheDocument();

    const dropdown = screen.getByLabelText('Show:');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveValue('10');
  });

  test('reset form fields when Add Task dialog is closed via cancel button', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 1')).toBeInTheDocument();

    const addTaskButton = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(addTaskButton);

    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, {
      target: { value: 'New Task Description' },
    });

    expect(descriptionInput).toHaveValue('New Task Description');

    const priorityInput = screen.getByLabelText(/priority/i);
    fireEvent.change(priorityInput, { target: { value: 'L' } });

    expect(priorityInput).toHaveValue('L');

    const projectSelect = await screen.findByTestId('project-select');
    fireEvent.change(projectSelect, { target: { value: 'ProjectA' } });

    expect(projectSelect).toHaveValue('ProjectA');

    const tagsInput = screen.getByPlaceholderText('Add a tag');
    fireEvent.change(tagsInput, { target: { value: 'urgent' } });
    fireEvent.keyDown(tagsInput, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('urgent')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Add a new task')).not.toBeInTheDocument();
    });

    fireEvent.click(addTaskButton);

    const descriptionInputAfter = screen.getByLabelText(/description/i);
    const priorityInputAfter = screen.getByLabelText(/priority/i);
    const projectSelectAfter = await screen.findByTestId('project-select');

    expect(descriptionInputAfter).toHaveValue('');
    expect(priorityInputAfter).toHaveValue('');
    expect(projectSelectAfter).toHaveValue('');
    expect(screen.queryByText('urgent')).not.toBeInTheDocument();
  });

  test('loads "tasksPerPage" from localStorage on initial render', async () => {
    localStorageMock.setItem('mockHashedKey', '20');

    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 1')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Show:')).toHaveValue('20');
  });

  test('updates pagination when "Tasks per Page" is changed', async () => {
    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 12')).toBeInTheDocument();
    });

    expect(screen.getByTestId('total-pages')).toHaveTextContent('2');

    const dropdown = screen.getByLabelText('Show:');
    fireEvent.change(dropdown, { target: { value: '5' } });

    expect(screen.getByTestId('total-pages')).toHaveTextContent('3');

    expect(localStorageMock.setItem).toHaveBeenCalledWith('mockHashedKey', '5');

    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
  });

  test('shows tags as badges in task dialog and allows editing (add on Enter)', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 1')).toBeInTheDocument();

    const taskRow = screen.getByText('Task 1');
    fireEvent.click(taskRow);

    expect(await screen.findByText('Tags:')).toBeInTheDocument();

    expect(screen.getByText('tag1')).toBeInTheDocument();

    const tagsLabel = screen.getByText('Tags:');
    const tagsRow = tagsLabel.closest('tr') as HTMLElement;
    const pencilButton = within(tagsRow).getByRole('button');
    fireEvent.click(pencilButton);

    const editInput = await screen.findByPlaceholderText(
      'Add a tag (press enter to add)'
    );

    fireEvent.change(editInput, { target: { value: 'newtag' } });
    fireEvent.keyDown(editInput, { key: 'Enter', code: 'Enter' });

    expect(await screen.findByText('newtag')).toBeInTheDocument();

    expect((editInput as HTMLInputElement).value).toBe('');
  });

  test('adds a tag while editing and saves updated tags to backend', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 1')).toBeInTheDocument();

    const taskRow = screen.getByText('Task 1');
    fireEvent.click(taskRow);

    expect(await screen.findByText('Tags:')).toBeInTheDocument();

    const tagsLabel = screen.getByText('Tags:');
    const tagsRow = tagsLabel.closest('tr') as HTMLElement;
    const pencilButton = within(tagsRow).getByRole('button');
    fireEvent.click(pencilButton);

    const editInput = await screen.findByPlaceholderText(
      'Add a tag (press enter to add)'
    );

    fireEvent.change(editInput, { target: { value: 'addedtag' } });
    fireEvent.keyDown(editInput, { key: 'Enter', code: 'Enter' });

    expect(await screen.findByText('addedtag')).toBeInTheDocument();

    const saveButton = await screen.findByRole('button', {
      name: /save tags/i,
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      const hooks = require('../hooks');
      expect(hooks.editTaskOnBackend).toHaveBeenCalled();
    });

    const hooks = require('../hooks');
    const callArg = hooks.editTaskOnBackend.mock.calls[0][0];
    expect(callArg.tags).toEqual(expect.arrayContaining(['tag1', 'addedtag']));
  });

  test('removes a tag while editing and saves updated tags to backend', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 1')).toBeInTheDocument();

    const taskRow = screen.getByText('Task 1');
    fireEvent.click(taskRow);

    expect(await screen.findByText('Tags:')).toBeInTheDocument();

    const tagsLabel = screen.getByText('Tags:');
    const tagsRow = tagsLabel.closest('tr') as HTMLElement;
    const pencilButton = within(tagsRow).getByRole('button');
    fireEvent.click(pencilButton);

    const editInput = await screen.findByPlaceholderText(
      'Add a tag (press enter to add)'
    );

    fireEvent.change(editInput, { target: { value: 'newtag' } });
    fireEvent.keyDown(editInput, { key: 'Enter', code: 'Enter' });

    expect(await screen.findByText('newtag')).toBeInTheDocument();

    const tagBadge = screen.getByText('tag1');
    const badgeContainer = (tagBadge.closest('div') ||
      tagBadge.parentElement) as HTMLElement;

    const removeButton = within(badgeContainer).getByText('✖');
    fireEvent.click(removeButton);

    expect(screen.queryByText('tag1')).not.toBeInTheDocument();

    const saveButton = await screen.findByRole('button', {
      name: /save tags/i,
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      const hooks = require('../hooks');
      expect(hooks.editTaskOnBackend).toHaveBeenCalled();
    });

    const hooks = require('../hooks');
    const callArg = hooks.editTaskOnBackend.mock.calls[0][0];

    expect(callArg.tags).toEqual(expect.arrayContaining(['newtag', 'tag1']));
  });

  test('shows orange background on task ID and Overdue badge for overdue tasks', async () => {
    render(<Tasks {...mockProps} />);

    await screen.findByText('Task 12');

    const dropdown = screen.getByLabelText('Show:');
    fireEvent.change(dropdown, { target: { value: '20' } });

    const task1Description = screen.getByText('Task 1');
    const row = task1Description.closest('tr');
    const idElement = row?.querySelector('span');

    expect(idElement).toHaveClass('bg-red-600/80');
    fireEvent.click(idElement!);

    const overdueBadge = await screen.findByText('Overdue');
    expect(overdueBadge).toBeInTheDocument();
  });
  test('filters tasks with fuzzy search (handles typos)', async () => {
    jest.useFakeTimers();

    render(<Tasks {...mockProps} />);
    expect(await screen.findByText('Task 12')).toBeInTheDocument();

    const dropdown = screen.getByLabelText('Show:');
    fireEvent.change(dropdown, { target: { value: '50' } });

    const searchBar = screen.getByPlaceholderText('Search tasks...');
    fireEvent.change(searchBar, { target: { value: 'fiace' } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByText('Finance')).toBeInTheDocument();
    expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
    expect(screen.queryByText('Sales')).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  test('shows "overdue" in status filter options', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Mocked BottomBar')).toBeInTheDocument();

    const multiSelectFilter = require('@/components/ui/multi-select');

    expect(multiSelectFilter.MultiSelectFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Status',
        options: expect.arrayContaining(['overdue']),
      }),
      {}
    );
  });

  test('filters tasks to show only overdue tasks when status "overdue" is selected', async () => {
    const MultiSelectFilter =
      require('@/components/ui/multi-select').MultiSelectFilter;

    MultiSelectFilter.mockImplementation(({ title }: { title: string }) => {
      return <div data-testid={`ms-${title}`}>Mocked MultiSelect: {title}</div>;
    });

    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 12')).toBeInTheDocument();
    });

    const lastCall = MultiSelectFilter.mock.calls.find(
      (call: any[]) => call[0].title === 'Status'
    );

    const onSelectionChange = lastCall[0].onSelectionChange;

    act(() => {
      onSelectionChange(['overdue']);
    });

    const overdueTask = screen.getByText('Task 1');
    expect(overdueTask).toBeInTheDocument();
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
  });

  test('shows "O" badge for overdue tasks in status column', async () => {
    render(<Tasks {...mockProps} />);

    await screen.findByText('Task 12');

    const dropdown = screen.getByLabelText('Show:');
    fireEvent.change(dropdown, { target: { value: '20' } });

    const row = screen.getByText('Task 1').closest('tr')!;
    const statusCell = within(row).getByText('O');

    expect(statusCell).toBeInTheDocument();
  });

  test('does not show "O" badge for non-overdue pending tasks', async () => {
    render(<Tasks {...mockProps} />);

    await screen.findByText('Task 12');

    const dropdown = screen.getByLabelText('Show:');
    fireEvent.change(dropdown, { target: { value: '20' } });

    expect(await screen.findByText('Task 2')).toBeInTheDocument();

    const row = screen.getByText('Task 2').closest('tr')!;
    const statusCell = within(row).getByText('P');

    expect(statusCell).toBeInTheDocument();
  });

  test('overdue tasks appear at the top of the list', async () => {
    render(<Tasks {...mockProps} />);

    await screen.findByText('Task 12');

    const dropdown = screen.getByLabelText('Show:');
    fireEvent.change(dropdown, { target: { value: '20' } });

    const firstRow = screen.getAllByRole('row')[1];
    expect(within(firstRow).getByText('Task 1')).toBeInTheDocument();
  });

  test('project dropdown lists existing projects and create-new option', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 1')).toBeInTheDocument();

    const addTaskButton = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(addTaskButton);

    const projectSelect = await screen.findByTestId('project-select');
    expect(
      within(projectSelect).getByText('Select a project')
    ).toBeInTheDocument();
    expect(within(projectSelect).getByText('Engineering')).toBeInTheDocument();
    expect(within(projectSelect).getByText('ProjectA')).toBeInTheDocument();
    expect(
      within(projectSelect).getByText('+ Create new project…')
    ).toBeInTheDocument();
  });

  test('selecting "+ Create new project…" reveals inline input', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    const projectSelect = await screen.findByTestId('project-select');
    fireEvent.change(projectSelect, { target: { value: '__CREATE_NEW__' } }); // Empty string triggers "create new project" mode

    const newProjectInput =
      await screen.findByPlaceholderText('New project name');
    fireEvent.change(newProjectInput, {
      target: { value: 'My Fresh Project' },
    });

    expect(newProjectInput).toHaveValue('My Fresh Project');
  });
});
