import { render, screen, fireEvent } from '@testing-library/react';
import {
  exportTasksAsJSON,
  exportTasksAsTXT,
} from '@/components/utils/ExportTasks';
import { NavbarMobile } from '../NavbarMobile';
import {
  deleteAllTasks,
  handleLogout,
  Props,
  routeList,
} from '../navbar-utils';

jest.mock('@/components/utils/ExportTasks', () => ({
  exportTasksAsJSON: jest.fn(),
  exportTasksAsTXT: jest.fn(),
}));

jest.mock('@/components/HomeComponents/Navbar/navbar-utils', () => ({
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

    // Verify the confirmation modal appears
    expect(screen.getByText('Delete All Tasks?')).toBeInTheDocument();
    expect(
      screen.getByText(/This action cannot be undone/i)
    ).toBeInTheDocument();
  });

  it('calls deleteAllTasks when confirmation is accepted', () => {
    const openProps = { ...mockProps, isOpen: true };
    render(<NavbarMobile {...openProps} />);

    // Click the initial delete button to open modal
    const deleteButtons = screen.getAllByText('Delete All Tasks');
    fireEvent.click(deleteButtons[0]);

    // After modal opens, there should be 2 "Delete All Tasks" texts
    // The second one is the confirmation button in the modal
    const updatedDeleteButtons = screen.getAllByText('Delete All Tasks');
    expect(updatedDeleteButtons).toHaveLength(2);

    // Click the confirmation button (second one)
    fireEvent.click(updatedDeleteButtons[1]);
    expect(deleteAllTasks).toHaveBeenCalledWith(openProps);
  });

  it("calls handleLogout when 'Log out' is clicked", () => {
    render(<NavbarMobile {...openProps} />);
    const logoutButton = screen.getByText('Log out');

    fireEvent.click(logoutButton);
    expect(handleLogout).toHaveBeenCalled();
  });

  test('export task as json and close menu', () => {
    render(<NavbarMobile {...openProps} />);

    fireEvent.click(screen.getByText('Export Tasks'));
    fireEvent.click(screen.getByText('Download .json'));

    expect(exportTasksAsJSON).toHaveBeenCalledWith(openProps.tasks);
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });

  test('export task as txt and close menu', () => {
    render(<NavbarMobile {...openProps} />);

    fireEvent.click(screen.getByText('Export Tasks'));
    fireEvent.click(screen.getByText('Download .txt'));

    expect(exportTasksAsTXT).toHaveBeenCalledWith(openProps.tasks);
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });

  test('opens auto-sync dialog', () => {
    render(<NavbarMobile {...openProps} />);

    fireEvent.click(screen.getByText('Auto-sync'));

    expect(screen.getByText(/Enable Auto-Sync/i)).toBeInTheDocument();
  });

  describe('Navigation link click behavior', () => {
    beforeEach(() => {
      // Mock scrollIntoView
      Element.prototype.scrollIntoView = jest.fn();
      // Mock setTimeout
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should close the sheet immediately when clicking a nav link', () => {
      render(<NavbarMobile {...openProps} />);

      const tasksLink = screen.getByText('Tasks');
      fireEvent.click(tasksLink);

      expect(mockSetIsOpen).toHaveBeenCalledWith(false);
    });

    it('should scroll to target element after 300ms delay', () => {
      // Create a mock element
      const mockElement = document.createElement('div');
      mockElement.id = 'tasks';
      document.body.appendChild(mockElement);
      mockElement.scrollIntoView = jest.fn();

      render(<NavbarMobile {...openProps} />);

      const tasksLink = screen.getByText('Tasks');
      fireEvent.click(tasksLink);

      // scrollIntoView should not be called immediately
      expect(mockElement.scrollIntoView).not.toHaveBeenCalled();

      // Fast-forward time by 300ms
      jest.advanceTimersByTime(300);

      // Now scrollIntoView should have been called
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });

      // Cleanup
      document.body.removeChild(mockElement);
    });

    it('should extract the correct target ID from href', () => {
      const mockElement = document.createElement('div');
      mockElement.id = 'setup-guide';
      document.body.appendChild(mockElement);
      mockElement.scrollIntoView = jest.fn();

      render(<NavbarMobile {...openProps} />);

      const setupGuideLink = screen.getByText('Setup Guide');
      fireEvent.click(setupGuideLink);

      jest.advanceTimersByTime(300);

      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });

      document.body.removeChild(mockElement);
    });

    it('should handle case when target element does not exist', () => {
      render(<NavbarMobile {...openProps} />);

      const homeLink = screen.getByText('Home');
      fireEvent.click(homeLink);

      // Should not throw an error even if element doesn't exist
      expect(() => {
        jest.advanceTimersByTime(300);
      }).not.toThrow();
    });

    it('should handle multiple rapid clicks correctly', () => {
      const mockElement = document.createElement('div');
      mockElement.id = 'tasks';
      document.body.appendChild(mockElement);
      mockElement.scrollIntoView = jest.fn();

      render(<NavbarMobile {...openProps} />);

      const tasksLink = screen.getByText('Tasks');

      // Click multiple times
      fireEvent.click(tasksLink);
      fireEvent.click(tasksLink);
      fireEvent.click(tasksLink);

      // Sheet should be closed on each click
      expect(mockSetIsOpen).toHaveBeenCalledTimes(3);
      expect(mockSetIsOpen).toHaveBeenCalledWith(false);

      jest.advanceTimersByTime(300);

      // scrollIntoView should be called for each click
      expect(mockElement.scrollIntoView).toHaveBeenCalledTimes(3);

      document.body.removeChild(mockElement);
    });
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
