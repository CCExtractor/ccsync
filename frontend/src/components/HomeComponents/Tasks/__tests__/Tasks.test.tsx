import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  return jest.fn(({ onOpenFilterSheet }) => (
    <button onClick={onOpenFilterSheet}>Mock Filter Button</button>
  ));
});

global.fetch = jest.fn().mockResolvedValue({ ok: true });

describe('Tasks Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders tasks component and opens filter sheet', async () => {
    render(<Tasks {...mockProps} />);
    const user = userEvent.setup();

    //Check that the main title renders
    expect(screen.getByTestId('tasks')).toBeInTheDocument();

    //Find and click the new filter button from the mocked BottomBar
    const filterButton = screen.getByText('Mock Filter Button');
    await user.click(filterButton);

    //Check if the Sheet title appears
    expect(await screen.findByText('Filter Tasks')).toBeInTheDocument();

    //Check if the MultiSelectFilters are now visible inside the sheet
    expect(
      screen.getByText('Mocked MultiSelect: Projects')
    ).toBeInTheDocument();
    expect(screen.getByText('Mocked MultiSelect: Status')).toBeInTheDocument();
    expect(screen.getByText('Mocked MultiSelect: Tags')).toBeInTheDocument();
  });
});
