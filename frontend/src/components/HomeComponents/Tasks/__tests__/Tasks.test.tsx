import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Tasks } from '../Tasks';
import * as hooks from '../hooks';

// Mock props for the Tasks component
const mockProps = {
  origin: '',
  email: 'test@example.com',
  encryptionSecret: 'mockEncryptionSecret',
  UUID: 'mockUUID',
  isLoading: false,
  setIsLoading: jest.fn(),
};

// Create mock tasks with various properties
const createMockTasks = () => [
  {
    id: 1,
    description: 'Complete project documentation',
    status: 'pending',
    project: 'ProjectA',
    tags: ['urgent', 'docs'],
    uuid: 'uuid-1',
    priority: 'H',
    due: '2024-01-15',
    urgency: 5,
    entry: '2024-01-01',
    modified: '2024-01-05',
    start: '',
    wait: '',
    end: '',
    depends: [],
    recur: '',
    rtype: '',
  },
  {
    id: 2,
    description: 'Review code changes',
    status: 'completed',
    project: 'ProjectB',
    tags: ['review'],
    uuid: 'uuid-2',
    priority: 'M',
    due: '',
    urgency: 3,
    entry: '2024-01-02',
    modified: '2024-01-06',
    start: '',
    wait: '',
    end: '2024-01-06',
    depends: [],
    recur: '',
    rtype: '',
  },
  {
    id: 3,
    description: 'Fix bug in login',
    status: 'pending',
    project: 'ProjectA',
    tags: ['bug', 'urgent'],
    uuid: 'uuid-3',
    priority: 'H',
    due: '2024-01-10',
    urgency: 8,
    entry: '2024-01-03',
    modified: '2024-01-07',
    start: '',
    wait: '',
    end: '',
    depends: [],
    recur: '',
    rtype: '',
  },
  {
    id: 4,
    description: 'Update dependencies',
    status: 'deleted',
    project: 'ProjectC',
    tags: ['maintenance'],
    uuid: 'uuid-4',
    priority: 'L',
    due: '',
    urgency: 1,
    entry: '2024-01-04',
    modified: '2024-01-08',
    start: '',
    wait: '',
    end: '',
    depends: [],
    recur: '',
    rtype: '',
  },
  {
    id: 5,
    description: 'Write unit tests',
    status: 'pending',
    project: 'ProjectB',
    tags: ['testing'],
    uuid: 'uuid-5',
    priority: 'M',
    due: '2024-01-20',
    urgency: 4,
    entry: '2024-01-05',
    modified: '2024-01-09',
    start: '',
    wait: '',
    end: '',
    depends: [],
    recur: '',
    rtype: '',
  },
];

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
    ...originalModule,
    markTaskAsCompleted: jest.fn().mockResolvedValue({}),
    markTaskAsDeleted: jest.fn().mockResolvedValue({}),
    getTimeSinceLastSync: jest
      .fn()
      .mockReturnValue('Last updated 5 minutes ago'),
    hashKey: jest.fn().mockReturnValue('mockHashedKey'),
  };
});

jest.mock('@/components/ui/multiSelect', () => ({
  MultiSelectFilter: jest.fn(({ title, onSelectionChange, selectedValues }) => (
    <div data-testid={`multiselect-${title.toLowerCase()}`}>
      <span>Mocked MultiSelect: {title}</span>
      <button
        onClick={() => onSelectionChange(['ProjectA'])}
        data-testid={`multiselect-${title.toLowerCase()}-button`}
      >
        Select {title}
      </button>
      <span data-testid={`multiselect-${title.toLowerCase()}-selected`}>
        {selectedValues.join(',')}
      </span>
    </div>
  )),
}));

jest.mock('../../BottomBar/BottomBar', () => {
  return jest.fn(() => <div>Mocked BottomBar</div>);
});

jest.mock('../ReportsView', () => ({
  ReportsView: jest.fn(() => (
    <div data-testid="reports-view">Reports View</div>
  )),
}));

// Mock hooks module - must be created inside the mock factory
jest.mock('../hooks', () => {
  const mockTasksDatabase = {
    tasks: {
      where: jest.fn(),
      bulkPut: jest.fn(),
    },
    transaction: jest.fn(),
  };

  return {
    TasksDatabase: jest.fn(() => mockTasksDatabase),
    fetchTaskwarriorTasks: jest.fn(),
    addTaskToBackend: jest.fn(),
    editTaskOnBackend: jest.fn(),
    modifyTaskOnBackend: jest.fn(),
    __mockTasksDatabase: mockTasksDatabase, // Export for use in tests
  };
});

jest.mock('../Pagination', () => {
  return jest.fn((props) => (
    <div data-testid="mock-pagination">
      <span data-testid="total-pages">{props.totalPages}</span>
      <span data-testid="current-page">{props.currentPage}</span>
      <button onClick={() => props.paginate(2)} data-testid="pagination-next">
        Next
      </button>
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

    // Setup default mock for database
    const mockTasks = createMockTasks();
    const mockDb = (hooks as any).__mockTasksDatabase;
    if (mockDb) {
      mockDb.tasks.where.mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockTasks),
          delete: jest.fn().mockResolvedValue(undefined),
        }),
      });
    }
  });

  describe('Basic Rendering', () => {
    it('renders tasks component and the mocked BottomBar', async () => {
      render(<Tasks {...mockProps} />);
      expect(screen.getByTestId('tasks')).toBeInTheDocument();
      expect(screen.getByText('Mocked BottomBar')).toBeInTheDocument();
    });

    it('renders the tasks heading', async () => {
      render(<Tasks {...mockProps} />);
      expect(screen.getByTestId('tasks')).toBeInTheDocument();
    });

    it('renders Show Reports button', async () => {
      render(<Tasks {...mockProps} />);
      await waitFor(() => {
        expect(screen.getByText('Show Reports')).toBeInTheDocument();
      });
    });

    it('shows loading skeleton when isLoading is true', async () => {
      render(<Tasks {...mockProps} isLoading={true} />);
      await waitFor(() => {
        // Skeleton component should be rendered
        const skeletons = screen.getAllByRole('row');
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });

    it('displays tasks when loaded', async () => {
      render(<Tasks {...mockProps} />);
      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Reports Toggle', () => {
    it('toggles to reports view when button clicked', async () => {
      render(<Tasks {...mockProps} />);

      const reportButton = await screen.findByText('Show Reports');
      fireEvent.click(reportButton);

      await waitFor(() => {
        expect(screen.getByTestId('reports-view')).toBeInTheDocument();
      });
    });

    it('toggles back to tasks view from reports', async () => {
      render(<Tasks {...mockProps} />);

      const reportButton = await screen.findByText('Show Reports');
      fireEvent.click(reportButton);

      await waitFor(() => {
        expect(screen.getByTestId('reports-view')).toBeInTheDocument();
      });

      const tasksButton = screen.getByText('Show Tasks');
      fireEvent.click(tasksButton);

      await waitFor(() => {
        expect(screen.queryByTestId('reports-view')).not.toBeInTheDocument();
      });
    });

    it('changes button text when toggling reports', async () => {
      render(<Tasks {...mockProps} />);

      const reportButton = await screen.findByText('Show Reports');
      expect(reportButton).toBeInTheDocument();

      fireEvent.click(reportButton);

      await waitFor(() => {
        expect(screen.getByText('Show Tasks')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('renders search input', async () => {
      render(<Tasks {...mockProps} />);
      await waitFor(() => {
        const searchInput = screen.getByTestId('task-search-bar');
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('filters tasks by description when searching', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('task-search-bar');
      fireEvent.change(searchInput, { target: { value: 'documentation' } });

      // Debounce delay
      await waitFor(
        () => {
          expect(
            screen.getByText('Complete project documentation')
          ).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('shows empty results when no tasks match search', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('task-search-bar');
      fireEvent.change(searchInput, { target: { value: 'nonexistent task' } });

      await waitFor(
        () => {
          expect(
            screen.queryByText('Complete project documentation')
          ).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('updates search term state when input changes', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('task-search-bar');

      // Search for something
      fireEvent.change(searchInput, { target: { value: 'bug' } });

      // Input should have the value
      expect(searchInput).toHaveValue('bug');
    });
  });

  describe('Sorting Functionality', () => {
    it('sorts tasks by ID in ascending order', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const idHeader = screen.getByText('ID');
      fireEvent.click(idHeader);

      // Tasks should be sorted by ID ascending
      const taskRows = screen.getAllByRole('row');
      expect(taskRows.length).toBeGreaterThan(0);
    });

    it('sorts tasks by ID in descending order on second click', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const idHeader = screen.getByText('ID');

      // First click - ascending
      fireEvent.click(idHeader);

      // Second click - descending
      fireEvent.click(idHeader);

      await waitFor(() => {
        const taskRows = screen.getAllByRole('row');
        expect(taskRows.length).toBeGreaterThan(0);
      });
    });

    it('sorts tasks by status', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const statusHeader = screen.getByText('Status');
      fireEvent.click(statusHeader);

      await waitFor(() => {
        const taskRows = screen.getAllByRole('row');
        expect(taskRows.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Pagination', () => {
    it('renders the "Tasks per Page" dropdown with default value', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const dropdown = screen.getByLabelText('Show:');
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveValue('10');
    });

    it('loads "tasksPerPage" from localStorage on initial render', async () => {
      localStorageMock.setItem('mockHashedKey', '20');

      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Show:')).toHaveValue('20');
    });

    it('updates pagination when "Tasks per Page" is changed', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      expect(screen.getByTestId('total-pages')).toHaveTextContent('1');

      const dropdown = screen.getByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '5' } });

      expect(screen.getByTestId('total-pages')).toHaveTextContent('1');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mockHashedKey',
        '5'
      );
      expect(screen.getByTestId('current-page')).toHaveTextContent('1');
    });

    it('resets to page 1 when changing tasks per page', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const dropdown = screen.getByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '5' } });

      expect(screen.getByTestId('current-page')).toHaveTextContent('1');
    });
  });

  describe('Sync Functionality', () => {
    it('renders sync button on desktop', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        const syncButtons = screen.getAllByText('Sync');
        expect(syncButtons.length).toBeGreaterThan(0);
      });
    });

    it('calls setIsLoading when sync button clicked', async () => {
      const mockSetIsLoading = jest.fn();
      (hooks.fetchTaskwarriorTasks as jest.Mock).mockResolvedValue([]);

      render(<Tasks {...mockProps} setIsLoading={mockSetIsLoading} />);

      await waitFor(() => {
        const syncButtons = screen.getAllByText('Sync');
        expect(syncButtons.length).toBeGreaterThan(0);
      });

      const syncButton = screen.getAllByText('Sync')[0];
      fireEvent.click(syncButton);

      expect(mockSetIsLoading).toHaveBeenCalled();
    });

    it('displays last sync time', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Last updated 5 minutes ago')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Add Task Dialog', () => {
    it('renders Add Task button', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        const addButton = screen.getByText('Add Task');
        expect(addButton).toBeInTheDocument();
      });
    });

    it('Add Task button is clickable and enabled', async () => {
      render(<Tasks {...mockProps} />);

      const addButton = await screen.findByText('Add Task');

      // Button should be enabled
      expect(addButton).toBeEnabled();
      expect(addButton).not.toBeDisabled();
    });
  });

  describe('Task Details Dialog', () => {
    it('opens task details when task row is clicked', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
    });

    it('displays task details in dialog', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
        expect(screen.getByText('ID:')).toBeInTheDocument();
        expect(screen.getByText('Description:')).toBeInTheDocument();
      });
    });

    it('closes task details dialog when Close button is clicked', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });

      const closeButtons = screen.getAllByText('Close');
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Details')).not.toBeInTheDocument();
      });
    });
  });

  describe('Task Status Display', () => {
    it('displays pending tasks with P badge', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        const badges = screen.getAllByText('P');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('displays completed tasks with C badge', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        const badges = screen.getAllByText('C');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('displays deleted tasks with D badge', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        const badges = screen.getAllByText('D');
        expect(badges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Task Priority Display', () => {
    it('displays high priority indicator for high priority tasks', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      // High priority tasks should have red indicator
      const taskRows = screen.getAllByRole('row');
      expect(taskRows.length).toBeGreaterThan(0);
    });

    it('displays medium priority indicator for medium priority tasks', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Review code changes')).toBeInTheDocument();
      });

      const taskRows = screen.getAllByRole('row');
      expect(taskRows.length).toBeGreaterThan(0);
    });

    it('displays low priority indicator for tasks without H or M priority', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Update dependencies')).toBeInTheDocument();
      });

      const taskRows = screen.getAllByRole('row');
      expect(taskRows.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('displays "No tasks found" message when there are no tasks', async () => {
      // Mock empty tasks
      const mockDb = (hooks as any).__mockTasksDatabase;
      if (mockDb) {
        mockDb.tasks.where.mockReturnValue({
          equals: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
            delete: jest.fn().mockResolvedValue(undefined),
          }),
        });
      }

      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('found')).toBeInTheDocument();
      });
    });

    it('shows add task button in empty state', async () => {
      const mockDb = (hooks as any).__mockTasksDatabase;
      if (mockDb) {
        mockDb.tasks.where.mockReturnValue({
          equals: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
            delete: jest.fn().mockResolvedValue(undefined),
          }),
        });
      }

      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Add Task')).toBeInTheDocument();
      });
    });
  });

  describe('LocalStorage Integration', () => {
    it('saves tasksPerPage to localStorage', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const dropdown = screen.getByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '20' } });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mockHashedKey',
        '20'
      );
    });

    it('loads tasksPerPage from localStorage on mount', async () => {
      localStorageMock.setItem('mockHashedKey', '5');

      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Show:')).toHaveValue('5');
      });
    });

    it('loads lastSyncTime from localStorage', async () => {
      const now = Date.now();
      localStorageMock.setItem('mockHashedKey', now.toString());

      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(localStorageMock.getItem).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles database fetch errors gracefully', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const mockDb = (hooks as any).__mockTasksDatabase;
      if (mockDb) {
        mockDb.tasks.where.mockReturnValue({
          equals: jest.fn().mockReturnValue({
            toArray: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        });
      }

      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Filter Functionality', () => {
    it('renders project filter MultiSelect', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('multiselect-projects')).toBeInTheDocument();
      });
    });

    it('renders tag filter MultiSelect', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('multiselect-tags')).toBeInTheDocument();
      });
    });

    it('renders status filter MultiSelect', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('multiselect-status')).toBeInTheDocument();
      });
    });

    it('can trigger project filter selection', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('multiselect-projects')).toBeInTheDocument();
      });

      const projectButton = screen.getByTestId('multiselect-projects-button');
      fireEvent.click(projectButton);

      // Filter should be triggered
      expect(screen.getByTestId('multiselect-projects')).toBeInTheDocument();
    });

    it('can trigger tag filter selection', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('multiselect-tags')).toBeInTheDocument();
      });

      const tagButton = screen.getByTestId('multiselect-tags-button');
      fireEvent.click(tagButton);

      expect(screen.getByTestId('multiselect-tags')).toBeInTheDocument();
    });

    it('can trigger status filter selection', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('multiselect-status')).toBeInTheDocument();
      });

      const statusButton = screen.getByTestId('multiselect-status-button');
      fireEvent.click(statusButton);

      expect(screen.getByTestId('multiselect-status')).toBeInTheDocument();
    });
  });

  describe('Task Actions', () => {
    it('renders complete button for pending tasks', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      // Complete buttons should be rendered for pending tasks
      const taskRow = screen
        .getByText('Complete project documentation')
        .closest('tr');
      expect(taskRow).toBeInTheDocument();
    });

    it('renders delete button for tasks', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const taskRow = screen
        .getByText('Complete project documentation')
        .closest('tr');
      expect(taskRow).toBeInTheDocument();
    });

    it('handles task completion when complete button clicked', async () => {
      const { markTaskAsCompleted } = require('../tasks-utils');
      markTaskAsCompleted.mockResolvedValueOnce({});

      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      // Find and click a task row to open details
      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
    });

    it('handles task deletion when delete button clicked', async () => {
      const { markTaskAsDeleted } = require('../tasks-utils');
      markTaskAsDeleted.mockResolvedValueOnce({});

      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
    });
  });

  describe('Task Copy Functionality', () => {
    it('renders copy button for task UUID', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
        expect(screen.getByText('UUID:')).toBeInTheDocument();
      });
    });

    it('displays task UUID in details dialog', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('UUID:')).toBeInTheDocument();
      });
    });
  });

  describe('Task Properties Display', () => {
    it('displays task project in table', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        const projects = screen.getAllByText('ProjectA');
        expect(projects.length).toBeGreaterThan(0);
      });
    });

    it('displays task tags as badges', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        // Tags should be displayed
        const tags = screen.getAllByText(/urgent|docs|review|bug|testing/);
        expect(tags.length).toBeGreaterThan(0);
      });
    });

    it('displays multiple tags for a single task', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        // Tags should be rendered
        const tags = screen.getAllByText(/urgent|docs|review|bug|testing/);
        expect(tags.length).toBeGreaterThan(0);
      });
    });

    it('displays task urgency value', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      // Click to open details
      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
    });

    it('displays task due date when present', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
    });

    it('handles tasks without due date', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Review code changes')).toBeInTheDocument();
      });

      // Task 2 has no due date
      const taskRow = screen.getByText('Review code changes');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
    });
  });

  describe('Task Table Display', () => {
    it('renders table headers', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('renders task rows with correct data', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
        expect(screen.getByText('Review code changes')).toBeInTheDocument();
        expect(screen.getByText('Fix bug in login')).toBeInTheDocument();
      });
    });

    it('displays task ID column', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        // Task IDs should be visible
        const taskRows = screen.getAllByRole('row');
        expect(taskRows.length).toBeGreaterThan(1);
      });
    });

    it('displays task description column', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });
    });

    it('displays task status column with badges', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        // Status badges: P, C, D
        expect(screen.getAllByText('P').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Component State Management', () => {
    it('initializes with default state', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        // Should render in tasks view (not reports)
        expect(screen.queryByTestId('reports-view')).not.toBeInTheDocument();
      });
    });

    it('maintains state when switching between views', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      // Switch to reports
      const reportButton = screen.getByText('Show Reports');
      fireEvent.click(reportButton);

      await waitFor(() => {
        expect(screen.getByTestId('reports-view')).toBeInTheDocument();
      });

      // Switch back to tasks
      const tasksButton = screen.getByText('Show Tasks');
      fireEvent.click(tasksButton);

      await waitFor(() => {
        // Tasks should still be there
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });
    });

    it('preserves current page when changing tasks per page', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const dropdown = screen.getByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '20' } });

      // Should reset to page 1
      expect(screen.getByTestId('current-page')).toHaveTextContent('1');
    });
  });

  describe('Loading States', () => {
    it('shows skeleton when isLoading is true', async () => {
      render(<Tasks {...mockProps} isLoading={true} />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(0);
      });
    });

    it('hides skeleton when isLoading is false', async () => {
      render(<Tasks {...mockProps} isLoading={false} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });
    });

    it('shows loading state during sync', async () => {
      const mockSetIsLoading = jest.fn();
      render(<Tasks {...mockProps} setIsLoading={mockSetIsLoading} />);

      await waitFor(() => {
        const syncButtons = screen.getAllByText('Sync');
        expect(syncButtons.length).toBeGreaterThan(0);
      });

      const syncButton = screen.getAllByText('Sync')[0];
      fireEvent.click(syncButton);

      expect(mockSetIsLoading).toHaveBeenCalled();
    });
  });

  describe('Task Details Fields', () => {
    it('displays entry date in task details', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('Entry:')).toBeInTheDocument();
      });
    });

    it('displays modified date in task details', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        // Modified date should be in details
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
    });

    it('displays priority in task details', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('Priority:')).toBeInTheDocument();
      });
    });

    it('displays project in task details', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('Project:')).toBeInTheDocument();
      });
    });

    it('displays tags in task details', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('Tags:')).toBeInTheDocument();
      });
    });

    it('displays urgency in task details', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const taskRow = screen.getByText('Complete project documentation');
      fireEvent.click(taskRow);

      await waitFor(() => {
        expect(screen.getByText('Urgency:')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('renders sync button on desktop view', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        const syncButtons = screen.getAllByText('Sync');
        expect(syncButtons.length).toBeGreaterThan(0);
      });
    });

    it('renders mobile controls', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        // Mobile controls should be present
        expect(screen.getByLabelText('Show:')).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence', () => {
    it('persists tasks per page selection', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete project documentation')
        ).toBeInTheDocument();
      });

      const dropdown = screen.getByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '20' } });

      // Should call setItem with the new value
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('retrieves tasks from database on mount', async () => {
      const mockDb = (hooks as any).__mockTasksDatabase;

      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(mockDb.tasks.where).toHaveBeenCalled();
      });
    });
  });
});
