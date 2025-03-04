import { render, screen } from '@testing-library/react';
import { ModeToggle } from '../theme-mode-toggle';
import { useTheme } from '@/components/utils/theme-provider';

// Mocking the useTheme hook
jest.mock('@/components/utils/theme-provider');

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
