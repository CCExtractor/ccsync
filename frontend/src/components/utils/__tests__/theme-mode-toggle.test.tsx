import { fireEvent, render, screen } from '@testing-library/react';
import { ModeToggle } from '../ThemeModeToggle';
import { useTheme } from '@/components/utils/ThemeProvider';

// Mocking the useTheme hook
jest.mock('@/components/utils/ThemeProvider');

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

describe('ModeToggle', () => {
  const setThemeMock = jest.fn();

  beforeEach(() => {
    setThemeMock.mockClear();
    (useTheme as jest.Mock).mockReturnValue({ setTheme: setThemeMock });
  });

  test('renders without crashing', () => {
    render(<ModeToggle />);
    expect(
      screen.getByRole('button', { name: /toggle theme/i })
    ).toBeInTheDocument();
  });

  test('calls setTheme(light) when Light is clicked', () => {
    render(<ModeToggle />);

    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

    fireEvent.click(screen.getByText('Light'));
    expect(setThemeMock).toHaveBeenCalledWith('light');
  });

  test('calls setTheme(dark) when Dark is clicked', () => {
    render(<ModeToggle />);

    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

    fireEvent.click(screen.getByText('Dark'));
    expect(setThemeMock).toHaveBeenCalledWith('dark');
  });

  test('calls setTheme(system) when System is clicked', () => {
    render(<ModeToggle />);

    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

    fireEvent.click(screen.getByText('System'));
    expect(setThemeMock).toHaveBeenCalledWith('system');
  });

  test('render sun and moon icons', () => {
    render(<ModeToggle />);

    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });
});
