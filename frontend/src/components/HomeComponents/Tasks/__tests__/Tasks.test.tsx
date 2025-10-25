import { render, screen } from '@testing-library/react';
import { Tasks } from '../Tasks'; // Ensure correct path to Tasks component

// Mock props for the Tasks component
const mockProps = {
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

jest.mock('../tasks-utils', () => ({
  markTaskAsCompleted: jest.fn(),
  markTaskAsDeleted: jest.fn(),
  sortTasksById: jest.fn().mockImplementation((tasks) => tasks),
  sortTasks: jest.fn().mockImplementation((tasks) => tasks),
  getTimeSinceLastSync: jest.fn().mockReturnValue('Last updated 5 minutes ago'),
  formattedDate: jest.fn().mockImplementation((date) => date),
  getDisplayedPages: jest.fn().mockReturnValue([1, 2, 3]),
  handleCopy: jest.fn(),
  handleDate: jest.fn().mockReturnValue(true),
}));

global.fetch = jest.fn().mockResolvedValue({ ok: true });

describe('Tasks Component', () => {
  test('renders tasks component', async () => {
    render(<Tasks origin={''} {...mockProps} />);
    expect(screen.getByTestId('tasks')).toBeInTheDocument();
  });
});
