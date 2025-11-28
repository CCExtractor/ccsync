import { render, screen } from '@testing-library/react';
import { ModeToggle } from '../ThemeModeToggle';
import { useTheme } from '@/components/utils/ThemeProvider';

// Mocking the useTheme hook
jest.mock('@/components/utils/ThemeProvider');

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
});
