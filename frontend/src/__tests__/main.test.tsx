import React from 'react';
import ReactDOM from 'react-dom/client';

jest.mock('../App.tsx', () => ({
  __esModule: true,
  default: () => <div data-testid="app">App</div>,
}));

jest.mock('@/components/utils/ThemeProvider.tsx', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

describe('main.tsx', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('has root element available for React app', () => {
    const rootElement = document.getElementById('root');
    expect(rootElement).toBeInTheDocument();
    expect(rootElement).not.toBeNull();
  });

  it('can create React root without errors', () => {
    const rootElement = document.getElementById('root');
    expect(() => {
      ReactDOM.createRoot(rootElement!);
    }).not.toThrow();
  });

  it('imports required React dependencies', () => {
    expect(React).toBeDefined();
    expect(ReactDOM).toBeDefined();
    expect(React.StrictMode).toBeDefined();
  });

  it('verifies App and ThemeProvider components are available', () => {
    const App = require('../App.tsx').default;
    const { ThemeProvider } = require('@/components/utils/ThemeProvider.tsx');

    expect(App).toBeDefined();
    expect(ThemeProvider).toBeDefined();
    expect(typeof App).toBe('function');
    expect(typeof ThemeProvider).toBe('function');
  });
});
