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

describe('main.tsx bootstrap', () => {
  const renderMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(ReactDOM, 'createRoot').mockReturnValue({
      render: renderMock,
    } as any);

    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('creates React root and renders the app', async () => {
    await import('../main.tsx');

    expect(ReactDOM.createRoot).toHaveBeenCalledWith(
      document.getElementById('root')
    );
    expect(renderMock).toHaveBeenCalled();
  });
});
