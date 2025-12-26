import { render, screen, fireEvent } from '@testing-library/react';
import { ModeToggle } from '../ThemeModeToggle';
import { useTheme } from '@/components/utils/ThemeProvider';

// Mocking the useTheme hook
jest.mock('@/components/utils/ThemeProvider');

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => (asChild ? children : <div>{children}</div>),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button onClick={onClick} data-testid={`menu-item-${children}`}>
      {children}
    </button>
  ),
}));

describe('ModeToggle', () => {
  const setThemeMock = jest.fn();

  beforeEach(() => {
    setThemeMock.mockClear();
    (useTheme as jest.Mock).mockReturnValue({ setTheme: setThemeMock });
  });

  it('renders toggle button with icons', () => {
    render(<ModeToggle />);

    expect(
      screen.getByRole('button', { name: /toggle theme/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<ModeToggle />);

    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('uses the theme hook correctly', () => {
    render(<ModeToggle />);

    expect(useTheme).toHaveBeenCalled();
  });

  it('has proper button styling classes', () => {
    render(<ModeToggle />);

    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toHaveClass('ghost');
  });

  it('contains screen reader text', () => {
    render(<ModeToggle />);

    expect(screen.getByText('Toggle theme')).toHaveClass('sr-only');
  });

  it('renders all theme options', () => {
    render(<ModeToggle />);

    expect(screen.getByTestId('menu-item-Light')).toBeInTheDocument();
    expect(screen.getByTestId('menu-item-Dark')).toBeInTheDocument();
    expect(screen.getByTestId('menu-item-System')).toBeInTheDocument();
  });

  it('calls setTheme with light when light option is clicked', () => {
    render(<ModeToggle />);

    const lightOption = screen.getByTestId('menu-item-Light');
    fireEvent.click(lightOption);

    expect(setThemeMock).toHaveBeenCalledWith('light');
  });

  it('calls setTheme with dark when dark option is clicked', () => {
    render(<ModeToggle />);

    const darkOption = screen.getByTestId('menu-item-Dark');
    fireEvent.click(darkOption);

    expect(setThemeMock).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme with system when system option is clicked', () => {
    render(<ModeToggle />);

    const systemOption = screen.getByTestId('menu-item-System');
    fireEvent.click(systemOption);

    expect(setThemeMock).toHaveBeenCalledWith('system');
  });
});
