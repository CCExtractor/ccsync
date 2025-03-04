import { render } from '@testing-library/react';
import { NavbarDesktop } from '../NavbarDesktop';

// Mock external dependencies
jest.mock('../navbar-utils', () => ({
  syncTasksWithTwAndDb: jest.fn(),
  deleteAllTasks: jest.fn(),
  handleLogout: jest.fn(),
  routeList: [{ href: '#', label: 'Home' }],
}));

describe('NavbarDesktop', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<NavbarDesktop />);
  });
});
