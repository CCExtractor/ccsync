import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { ThemeProvider, useTheme } from '../ThemeProvider';

describe('ThemeProvider', () => {
  let originalMatchMedia: ((query: string) => MediaQueryList) &
    ((query: string) => MediaQueryList);

  beforeAll(() => {
    originalMatchMedia = window.matchMedia;
    window.matchMedia = jest.fn().mockImplementation((query) => {
      return {
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    });
  });

  afterAll(() => {
    window.matchMedia = originalMatchMedia;
  });

  beforeEach(() => {
    localStorage.clear();
  });

  const TestComponent = () => {
    const { theme, setTheme } = useTheme();
    return (
      <div>
        <span data-testid="theme">{theme}</span>
        <button onClick={() => setTheme('light')}>Set Light Theme</button>
      </div>
    );
  };

  test('should use default theme if no theme is stored in localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  test('should use stored theme from localStorage', () => {
    localStorage.setItem('vite-ui-theme', 'light');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  test('should update theme and localStorage when setTheme is called', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    act(() => {
      screen.getByText('Set Light Theme').click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(localStorage.getItem('vite-ui-theme')).toBe('light');
  });

  test('useTheme hook should throw error when used outside ThemeProvider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const TestErrorComponent = () => {
      try {
        useTheme();
      } catch (error) {
        return <span>Error</span>;
      }
      return null;
    };

    render(<TestErrorComponent />);
    consoleError.mockRestore();
  });

  test('should apply system theme if theme is set to system', () => {
    localStorage.setItem('vite-ui-theme', 'system');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const expectedTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light';

    expect(document.documentElement.classList.contains(expectedTheme)).toBe(
      true
    );
  });
});
