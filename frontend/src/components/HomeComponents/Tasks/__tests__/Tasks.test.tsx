import { render, screen, fireEvent } from '@testing-library/react';
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
          toArray: jest.fn().mockResolvedValue(
            Array.from({ length: 12 }, (_, i) => ({
              id: i + 1,
              description: `Task ${i + 1}`,
              status: 'pending',
              project: i % 2 === 0 ? 'ProjectA' : 'ProjectB',
              tags: i % 3 === 0 ? ['tag1'] : ['tag2'],
              uuid: `uuid-${i + 1}`,
              due: i === 0 ? '20200101T120000Z' : undefined,
            }))
          ),
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
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 12')).toBeInTheDocument();

    const dropdown = screen.getByLabelText('Show:');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveValue('10');
  });

  test('loads "tasksPerPage" from localStorage on initial render', async () => {
    localStorageMock.setItem('mockHashedKey', '20');

    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 1')).toBeInTheDocument();

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

  test('shows red background on task ID and Overdue badge for overdue tasks', async () => {
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
});
