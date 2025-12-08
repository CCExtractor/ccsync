import React from 'react';
import {
  render,
  waitFor,
  screen,
  fireEvent,
  act,
} from '@testing-library/react';
import { DevLogs } from '../DevLogs';

// Mock UI components - DevLogs uses Button and Select components
jest.mock('../../../ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('../../../ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { onValueChange })
      )}
    </div>
  ),
  SelectContent: ({ children, onValueChange }: any) => (
    <div>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { onValueChange })
      )}
    </div>
  ),
  SelectItem: ({ children, value, onValueChange }: any) => (
    <div data-value={value} onClick={() => onValueChange(value)}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <div>{placeholder}</div>,
}));

jest.mock('lucide-react', () => ({
  CopyIcon: () => <div>CopyIcon</div>,
  CheckIcon: () => <div>CheckIcon</div>,
}));

jest.mock('../../../utils/URLs', () => ({
  url: {
    backendURL: 'http://mocked-backend-url/',
  },
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function (
  this: Date
) {
  return this.toUTCString();
});

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

const mockLogs = [
  {
    timestamp: '2024-01-01T12:00:00Z',
    level: 'INFO',
    message: 'Sync operation started',
    syncId: 'sync-123',
    operation: 'SYNC_START',
  },
  {
    timestamp: '2024-01-01T12:01:00Z',
    level: 'WARN',
    message: 'Warning message',
  },
  {
    timestamp: '2024-01-01T12:02:00Z',
    level: 'ERROR',
    message: 'Error occurred',
    operation: 'SYNC_ERROR',
  },
  {
    timestamp: '2024-01-01T12:03:00Z',
    level: 'DEBUG',
    message: 'Debug message',
  },
];

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockLogs),
  })
) as jest.Mock;

describe('DevLogs', () => {
  const renderDevLogs = (isOpen: boolean) =>
    render(<DevLogs isOpen={isOpen} />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Snapshots – basic states', () => {
    it('renders closed dialog correctly', () => {
      const { asFragment } = renderDevLogs(false);
      expect(asFragment()).toMatchSnapshot('devlogs-closed');
    });

    it('renders open dialog with logs correctly', async () => {
      const { asFragment } = renderDevLogs(true);

      await waitFor(() => {
        expect(screen.queryByText('Loading logs...')).not.toBeInTheDocument();
      });

      expect(asFragment()).toMatchSnapshot('devlogs-with-logs');
    });

    it('renders loading state correctly', () => {
      (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

      const { asFragment } = renderDevLogs(true);

      expect(asFragment()).toMatchSnapshot('devlogs-loading');
    });

    it('renders empty logs state correctly', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      );

      const { asFragment } = renderDevLogs(true);

      await waitFor(() => {
        expect(screen.getByText('No logs available')).toBeInTheDocument();
      });

      expect(asFragment()).toMatchSnapshot('devlogs-empty');
    });
  });

  describe('Fetching logs', () => {
    it('calls fetch when dialog is opened', async () => {
      renderDevLogs(true);

      expect(fetch).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(screen.queryByText('Loading logs...')).not.toBeInTheDocument();
      });
    });

    it('displays logs when fetch succeeds', async () => {
      renderDevLogs(true);

      await waitFor(() =>
        expect(screen.getByText('Sync operation started')).toBeInTheDocument()
      );

      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });

    it('shows error toast when fetch fails', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
        })
      );

      renderDevLogs(true);

      await waitFor(() => {
        expect(require('react-toastify').toast.error).toHaveBeenCalledWith(
          'Failed to fetch logs',
          expect.any(Object)
        );
      });
    });

    it('calls fetchLogs when Refresh button is clicked', async () => {
      renderDevLogs(true);

      await waitFor(() =>
        expect(screen.queryByText('Loading logs...')).not.toBeInTheDocument()
      );

      expect(fetch).toHaveBeenCalledTimes(1);

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading & empty states', () => {
    it('shows loading state when logs are being fetched', () => {
      (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

      renderDevLogs(true);

      expect(screen.getByText('Loading logs...')).toBeInTheDocument();
    });

    it('hides loading state after logs are fetched', async () => {
      renderDevLogs(true);

      await waitFor(() => {
        expect(screen.queryByText('Loading logs...')).not.toBeInTheDocument();
      });
    });

    it('shows empty state when no logs are returned', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      );

      renderDevLogs(true);

      await waitFor(() => {
        expect(screen.getByText('No logs available')).toBeInTheDocument();
      });
    });

    it('handles null response data gracefully', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(null),
        })
      );

      renderDevLogs(true);

      await waitFor(() => {
        expect(screen.getByText('No logs available')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('shows all logs by default', async () => {
      renderDevLogs(true);

      await waitFor(() =>
        expect(screen.getByText('Sync operation started')).toBeInTheDocument()
      );

      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });

    it('filters INFO logs correctly', async () => {
      renderDevLogs(true);

      await waitFor(() =>
        expect(screen.getByText('Sync operation started')).toBeInTheDocument()
      );

      const filterSelect = screen.getByText('Filter by level');
      fireEvent.click(filterSelect);

      const infoOption = screen.getByText('INFO');
      fireEvent.click(infoOption);

      expect(screen.getByText('Sync operation started')).toBeInTheDocument();
      expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
      expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
    });

    it('filters WARN logs correctly', async () => {
      renderDevLogs(true);

      await waitFor(() =>
        expect(screen.getByText('Sync operation started')).toBeInTheDocument()
      );

      fireEvent.click(screen.getByText('Filter by level'));
      fireEvent.click(screen.getByText('WARN'));

      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(
        screen.queryByText('Sync operation started')
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
    });

    it('filters ERROR logs correctly', async () => {
      renderDevLogs(true);

      await waitFor(() =>
        expect(screen.getByText('Sync operation started')).toBeInTheDocument()
      );

      fireEvent.click(screen.getByText('Filter by level'));
      fireEvent.click(screen.getByText('ERROR'));

      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(
        screen.queryByText('Sync operation started')
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
    });
  });

  describe('Copy actions', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('copies a single log correctly', async () => {
      renderDevLogs(true);

      await waitFor(() =>
        expect(screen.getByText('Sync operation started')).toBeInTheDocument()
      );

      const copyButtons = screen.getAllByRole('button', { name: 'CopyIcon' });

      const secondCopyButton = copyButtons[1];
      fireEvent.click(secondCopyButton);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `[2024-01-01T12:01:00Z] [WARN] Warning message`
      );

      const firstCopyButton = copyButtons[0];

      fireEvent.click(firstCopyButton);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `[2024-01-01T12:00:00Z] [INFO] Sync operation started | Operation: SYNC_START | Sync ID: sync-123`
      );

      expect(screen.getByText('CheckIcon')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.queryByText('CheckIcon')).not.toBeInTheDocument();
    });

    it('copies all logs correctly', async () => {
      renderDevLogs(true);

      await waitFor(() =>
        expect(screen.getByText('Sync operation started')).toBeInTheDocument()
      );

      const copyAllButton = screen.getByText('Copy All');
      fireEvent.click(copyAllButton);

      const clipboardCall = (navigator.clipboard.writeText as jest.Mock).mock
        .calls[0][0];

      expect(clipboardCall).toContain('[INFO] Sync operation started');
      expect(clipboardCall).toContain('[WARN] Warning message');
      expect(clipboardCall).toContain('[ERROR] Error occurred');
      expect(clipboardCall).toContain('[DEBUG] Debug message');

      expect(require('react-toastify').toast.success).toHaveBeenCalledTimes(1);
    });

    it('disables Copy All button when no logs', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      );

      renderDevLogs(true);

      await waitFor(() =>
        expect(screen.getByText('No logs available')).toBeInTheDocument()
      );

      const copyAllButton = screen.getByText('Copy All');
      expect(copyAllButton).toBeDisabled();
    });
  });

  describe('Helpers & callbacks', () => {
    it('applies correct color classes based on log level', async () => {
      renderDevLogs(true);

      await waitFor(() =>
        expect(screen.getByText('Sync operation started')).toBeInTheDocument()
      );

      expect(screen.getByText('[INFO]')).toHaveClass('text-blue-600', {
        exact: false,
      });

      expect(screen.getByText('[WARN]')).toHaveClass('text-yellow-600', {
        exact: false,
      });

      expect(screen.getByText('[ERROR]')).toHaveClass('text-red-600', {
        exact: false,
      });

      expect(screen.getByText('[DEBUG]')).toHaveClass('text-gray-600', {
        exact: false,
      });
    });

    it('formats timestamps using mocked toLocaleString', async () => {
      renderDevLogs(true);

      await waitFor(() =>
        expect(
          screen.getByText('Mon, 01 Jan 2024 12:00:00 GMT')
        ).toBeInTheDocument()
      );
    });
  });
});
