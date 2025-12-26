jest.mock('@/components/ui/slider', () => ({
  Slider: () => <div data-testid="sync-slider" />,
}));
jest.mock('@/components/ui/switch', () => ({
  Switch: ({ onCheckedChange }: any) => (
    <button onClick={() => onCheckedChange(true)}>toggle</button>
  ),
}));
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavbarDesktop } from '../NavbarDesktop';
import { Props, routeList } from '../navbar-utils';

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
jest.mock('@/components/HomeComponents/DevLogs/DevLogs', () => ({
  DevLogs: () => <div data-testid="dev-logs-dialog" />,
}));

jest.mock('@/components/utils/URLs', () => ({
  url: {
    githubRepoURL: 'https://github.com/test/repo',
  },
}));
const mockSetIsLoading = jest.fn();

const mockProps: Props = {
  imgurl: 'http://example.com/image.png',
  email: 'test@example.com',
  encryptionSecret: 'secret',
  origin: 'http://localhost:3000',
  UUID: '1234-5678',
  tasks: [],
};

const extendedProps = {
  ...mockProps,
  isLoading: false,
  setIsLoading: mockSetIsLoading,
};

describe('NavbarDesktop', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('renders the navigation links correctly', () => {
    render(<NavbarDesktop {...extendedProps} />);

    routeList.forEach((route) => {
      expect(screen.getByText(route.label)).toBeInTheDocument();
    });
  });
  it('opens user menu and displays email', async () => {
    render(<NavbarDesktop {...extendedProps} />);

    const avatarFallback = screen.getByText('CN');
    await userEvent.click(avatarFallback);

    expect(screen.getAllByText('test@example.com')[0]).toBeInTheDocument();
  });
  it('opens github link when clicked', async () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    const user = userEvent.setup();
    render(<NavbarDesktop {...extendedProps} />);

    await user.click(screen.getByText('CN'));
    await user.click(screen.getByText('GitHub'));

    expect(openSpy).toHaveBeenCalledWith(
      'https://github.com/test/repo',
      '_blank'
    );

    openSpy.mockRestore();
  });
  it('shows slider when auto sync is enabled', async () => {
    const user = userEvent.setup();
    render(<NavbarDesktop {...extendedProps} />);

    await user.click(screen.getByText('CN'));
    await user.click(screen.getByText('toggle'));

    expect(screen.getByTestId('sync-slider')).toBeInTheDocument();
  });
});

describe('NavbarDesktop snapshot', () => {
  it('renders correctly', () => {
    const { asFragment } = render(<NavbarDesktop {...extendedProps} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
