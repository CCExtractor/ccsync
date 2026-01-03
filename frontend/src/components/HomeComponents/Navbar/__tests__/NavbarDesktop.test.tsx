import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavbarDesktop } from '../NavbarDesktop';
import { Props, routeList } from '../navbar-utils';

// Mock external dependencies
jest.mock('@/components/ui/slider', () => ({
  Slider: () => <div data-testid="sync-slider">slider</div>,
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ onCheckedChange }: any) => (
    <button onClick={() => onCheckedChange(true)}>toggle</button>
  ),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, onSelect }: any) => (
    <div onClick={onClick} onMouseDown={(e) => onSelect?.(e)}>
      {children}
    </div>
  ),
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogTrigger: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => (
    <div data-testid="dialog">{children}</div>
  ),
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarImage: () => <img alt="avatar" />,
  AvatarFallback: ({ children }: any) => <button>{children}</button>,
}));

jest.mock('@/components/utils/ThemeModeToggle', () => ({
  ModeToggle: () => <div data-testid="mode-toggle" />,
}));

jest.mock('@/components/HomeComponents/DevLogs/DevLogs', () => ({
  DevLogs: () => <div data-testid="dev-logs" />,
}));

jest.mock('@/components/utils/TaskAutoSync', () => ({
  useTaskAutoSync: jest.fn(),
}));

jest.mock('@/components/utils/ExportTasks', () => ({
  exportTasksAsJSON: jest.fn(),
  exportTasksAsTXT: jest.fn(),
}));

jest.mock('@/components/utils/URLs', () => ({
  url: {
    githubRepoURL: 'https://github.com/test/repo',
  },
}));

jest.mock('../navbar-utils', () => ({
  routeList: [
    { href: '#', label: 'Home' },
    { href: '#tasks', label: 'Tasks' },
    { href: '#faq', label: 'FAQ' },
  ],
  deleteAllTasks: jest.fn(),
  handleLogout: jest.fn(),
}));

const mockSetIsLoading = jest.fn();

const baseProps: Props = {
  imgurl: 'http://example.com/avatar.png',
  email: 'test@example.com',
  encryptionSecret: 'secret',
  origin: 'http://localhost:3000',
  UUID: 'uuid',
  tasks: [],
};

const props = {
  ...baseProps,
  isLoading: false,
  setIsLoading: mockSetIsLoading,
};

describe('NavbarDesktop', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation links', () => {
    render(<NavbarDesktop {...props} />);

    routeList.forEach((route) => {
      expect(screen.getByText(route.label)).toBeInTheDocument();
    });
  });

  it('opens user menu and shows email', async () => {
    render(<NavbarDesktop {...props} />);

    await userEvent.click(screen.getByText('CN'));
    expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(0);
  });

  it('opens GitHub repo in new tab', async () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    render(<NavbarDesktop {...props} />);
    await userEvent.click(screen.getByText('CN'));
    await userEvent.click(screen.getByText('GitHub'));

    expect(openSpy).toHaveBeenCalledWith(
      'https://github.com/test/repo',
      '_blank'
    );

    openSpy.mockRestore();
  });

  it('exports tasks as TXT', async () => {
    const { exportTasksAsTXT } = require('@/components/utils/ExportTasks');

    render(<NavbarDesktop {...props} />);
    await userEvent.click(screen.getByText('CN'));
    await userEvent.click(screen.getByText('Export tasks'));
    await userEvent.click(screen.getByText('Download .txt'));

    expect(exportTasksAsTXT).toHaveBeenCalledWith([]);
  });

  it('exports tasks as JSON', async () => {
    const { exportTasksAsJSON } = require('@/components/utils/ExportTasks');

    render(<NavbarDesktop {...props} />);
    await userEvent.click(screen.getByText('CN'));
    await userEvent.click(screen.getByText('Export tasks'));
    await userEvent.click(screen.getByText('Download .json'));

    expect(exportTasksAsJSON).toHaveBeenCalledWith([]);
  });

  it('enables auto sync and shows slider', async () => {
    render(<NavbarDesktop {...props} />);

    await userEvent.click(screen.getByText('CN'));
    await userEvent.click(screen.getByText('toggle'));

    expect(screen.getByTestId('sync-slider')).toBeInTheDocument();
  });

  it('renders consistently (snapshot)', () => {
    const { asFragment } = render(<NavbarDesktop {...props} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
