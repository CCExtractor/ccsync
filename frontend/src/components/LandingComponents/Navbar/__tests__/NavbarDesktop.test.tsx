import { render } from '@testing-library/react';
import { NavbarDesktop } from '../NavbarDesktop';

// Mock external dependencies
jest.mock('../navbar-utils', () => ({
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

describe('NavbarDesktop component using snapshot', () => {
  it('renders correctly', () => {
    const { asFragment } = render(<NavbarDesktop />);
    expect(asFragment()).toMatchSnapshot();
  });
});
