import { render, screen, fireEvent, within } from '@testing-library/react';
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

jest.mock('@/components/ui/multiSelect', () => ({
  MultiSelectFilter: jest.fn(({ title }) => (
    <div>Mocked MultiSelect: {title}</div>
  )),
}));

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
            {
              id: 1,
              description: 'Normal Synced Task',
              status: 'pending',
              project: 'ProjectA',
              tags: ['tag1'],
              uuid: 'uuid-1',
            },
            {
              id: 2,
              description: 'Edited Unsynced Task',
              status: 'pending',
              project: 'ProjectB',
              tags: ['tag2'],
              uuid: 'uuid-2',
            },
            {
              id: -12345,
              description: 'New Temporary Task',
              status: 'pending',
              project: 'ProjectA',
              tags: ['tag1'],
              uuid: 'uuid-temp-3',
            },
            ...Array.from({ length: 9 }, (_, i) => ({
              id: i + 4,
              description: `Task ${i + 4}`,
              status: 'pending',
              project: i % 2 === 0 ? 'ProjectA' : 'ProjectB',
              tags: i % 3 === 0 ? ['tag1'] : ['tag2'],
              uuid: `uuid-${i + 4}`,
            })),
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

const STORAGE_KEY = 'ccsync_unsynced_uuids';

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

    const unsyncedUuids = ['uuid-2', 'uuid-temp-3'];
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(unsyncedUuids));
  });

  test('renders tasks component and the mocked BottomBar', async () => {
    render(<Tasks {...mockProps} />);
    expect(screen.getByTestId('tasks')).toBeInTheDocument();
    expect(screen.getByText('Mocked BottomBar')).toBeInTheDocument();
  });

  test('renders the "Tasks per Page" dropdown with default value', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 12')).toBeInTheDocument();

    const dropdown = screen.getByLabelText('Show:');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveValue('10');
  });

  test('loads "tasksPerPage" from localStorage on initial render', async () => {
    localStorageMock.setItem('mockHashedKey', '20');

    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Normal Synced Task')).toBeInTheDocument();

    expect(screen.getByLabelText('Show:')).toHaveValue('20');
  });

  test('updates pagination when "Tasks per Page" is changed', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 12')).toBeInTheDocument();

    expect(screen.getByTestId('total-pages')).toHaveTextContent('2');

    const dropdown = screen.getByLabelText('Show:');
    fireEvent.change(dropdown, { target: { value: '5' } });

    expect(screen.getByTestId('total-pages')).toHaveTextContent('3');

    expect(localStorageMock.setItem).toHaveBeenCalledWith('mockHashedKey', '5');

    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
  });

  test('renders the unsynced count badge on the sync button', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 12')).toBeInTheDocument();

    const countBadges = screen.getAllByText('2');
    expect(countBadges.length).toBeGreaterThan(0);

    const syncButton = screen.getAllByText('Sync')[0].closest('button');
    expect(within(syncButton!).getByText('2')).toBeInTheDocument();
  });

  test('renders an edited, unsynced task correctly', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Edited Unsynced Task')).toBeInTheDocument();
    expect(screen.getByText('Unsynced')).toBeInTheDocument();
  });

  test('renders a new, temporary task correctly', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 12')).toBeInTheDocument();

    const dropdown = screen.getByLabelText('Show:');
    fireEvent.change(dropdown, { target: { value: '50' } });

    expect(await screen.findByText('New Temporary Task')).toBeInTheDocument();
    expect(screen.getAllByText('Unsynced')[0]).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.queryByText('-12345')).not.toBeInTheDocument();
  });

  test('renders a normal, synced task correctly', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 12')).toBeInTheDocument();

    const dropdown = screen.getByLabelText('Show:');
    fireEvent.change(dropdown, { target: { value: '50' } });

    const taskText = await screen.findByText('Normal Synced Task');
    const taskRow = taskText.closest('tr');

    expect(taskRow).not.toBeNull();
    expect(within(taskRow!).getByText('1')).toBeInTheDocument();
    expect(within(taskRow!).queryByText('Unsynced')).not.toBeInTheDocument();
  });
});
