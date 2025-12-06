import { render, waitFor, screen } from '@testing-library/react';
import { DevLogs } from '../DevLogs';

// Mock UI components - DevLogs uses Button and Select components
jest.mock('../../../ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('../../../ui/select', () => ({
  Select: ({ children, value }: any) => (
    <div data-testid="select" data-value={value}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-value={value}>{children}</div>
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
];

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockLogs),
  })
) as jest.Mock;

describe('DevLogs Content Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial state without fetching logs when isOpen is false', () => {
    const { asFragment } = render(<DevLogs isOpen={false} />);

    // Should render the UI but not fetch logs
    expect(screen.getByText('No logs available')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(asFragment()).toMatchSnapshot('devlogs-initial-state');
  });

  it('renders with logs when isOpen is true', async () => {
    const { asFragment } = render(<DevLogs isOpen={true} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading logs...')).not.toBeInTheDocument();
    });

    // Verify logs are displayed
    expect(screen.getByText('Sync operation started')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByText('Error occurred')).toBeInTheDocument();

    expect(asFragment()).toMatchSnapshot('devlogs-with-logs');
  });

  it('renders loading state when fetching logs', () => {
    (fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );

    const { asFragment } = render(<DevLogs isOpen={true} />);

    expect(screen.getByText('Loading logs...')).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot('devlogs-loading');
  });

  it('renders empty logs state correctly', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );

    const { asFragment } = render(<DevLogs isOpen={true} />);

    await waitFor(() => {
      expect(screen.getByText('No logs available')).toBeInTheDocument();
    });

    expect(asFragment()).toMatchSnapshot('devlogs-empty');
  });
});
