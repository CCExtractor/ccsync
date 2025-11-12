import { render, screen, fireEvent } from '@testing-library/react';
import { NavbarMobile } from '../NavbarMobile';
import {
  deleteAllTasks,
  handleLogout,
  Props,
  routeList,
} from '../navbar-utils';

jest.mock('../navbar-utils', () => ({
  deleteAllTasks: jest.fn(),
  handleLogout: jest.fn(),
  routeList: [
    { href: '#', label: 'Home' },
    { href: '#tasks', label: 'Tasks' },
    { href: '#setup-guide', label: 'Setup Guide' },
    { href: '#faq', label: 'FAQ' },
  ],
}));

const mockSetIsOpen = jest.fn();
const mockSetIsLoading = jest.fn();
const mockProps: Props & {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
} = {
  imgurl: 'http://example.com/image.png',
  email: 'test@example.com',
  encryptionSecret: 'secret',
  origin: 'http://localhost:3000',
  UUID: '1234-5678',
  tasks: [],
  setIsOpen: mockSetIsOpen,
  isOpen: false,
  isLoading: false,
  setIsLoading: mockSetIsLoading,
};

const openProps = { ...mockProps, isOpen: true };

describe('NavbarMobile', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the ModeToggle and Menu button', () => {
    render(<NavbarMobile {...mockProps} />);
  });

  it('opens the menu when Menu button is clicked', () => {
    render(<NavbarMobile {...mockProps} />);
    const menuButton = screen.getByRole('button', { name: /menu icon/i });

    fireEvent.click(menuButton);
    expect(mockProps.setIsOpen).toHaveBeenCalledWith(true);
  });

  it('displays the navigation links and buttons correctly when menu is open', () => {
    render(<NavbarMobile {...openProps} />);

    routeList.forEach((route) => {
      expect(screen.getByText(route.label)).toBeInTheDocument();
    });
    expect(screen.getByText('Github')).toBeInTheDocument();
    expect(screen.getByText('Delete All Tasks')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('closes the menu when a navigation link is clicked', () => {
    render(<NavbarMobile {...openProps} />);

    const homeLink = screen.getByText('Home');
    fireEvent.click(homeLink);
    expect(mockProps.setIsOpen).toHaveBeenCalledWith(false);
  });

  it("calls deleteAllTasks when 'Delete All Tasks' is clicked", () => {
    render(<NavbarMobile {...openProps} />);
    const deleteButton = screen.getByText('Delete All Tasks');

    fireEvent.click(deleteButton);
    expect(deleteAllTasks).toHaveBeenCalledWith(openProps);
  });

  it("calls handleLogout when 'Log out' is clicked", () => {
    render(<NavbarMobile {...openProps} />);
    const logoutButton = screen.getByText('Log out');

    fireEvent.click(logoutButton);
    expect(handleLogout).toHaveBeenCalled();
  });
});

describe('NavbarMobile component using snapshot', () => {
  test('renders correctly when closed', () => {
    const { asFragment } = render(<NavbarMobile {...mockProps} />);
    expect(asFragment()).toMatchSnapshot('prop isOpen is set to false');
  });
});

describe('NavbarMobile component using snapshot', () => {
  test('renders correctly when open', () => {
    const { asFragment } = render(<NavbarMobile {...mockProps} />);
    expect(asFragment()).toMatchSnapshot('prop isOpen is set to true');
  });
});
