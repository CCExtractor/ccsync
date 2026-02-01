import { render, screen, waitFor } from '@testing-library/react';
import { HomePage } from '../HomePage';

// Mock dependencies
let receivedNavbarProps: any = null;
let mockSocket: any;
let lastDriverConfig: any = null;
const consoleErrorSpy = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {});
const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
const mockFetchTaskwarriorTasks = jest.fn();
const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();
const mockedNavigate = jest.fn();
const mockDrive = jest.fn();
const mockDestroy = jest.fn();

jest.mock('../HomeComponents/Navbar/Navbar', () => ({
  Navbar: (props: any) => {
    receivedNavbarProps = props;
    return <div>Mocked Navbar</div>;
  },
}));

jest.mock('../HomeComponents/Hero/Hero', () => ({
  Hero: () => <div>Mocked Hero</div>,
}));

jest.mock('../HomeComponents/Footer/Footer', () => ({
  Footer: () => <div>Mocked Footer</div>,
}));

jest.mock('../HomeComponents/SetupGuide/SetupGuide', () => ({
  SetupGuide: () => <div>Mocked SetupGuide</div>,
}));

jest.mock('../HomeComponents/FAQ/FAQ', () => ({
  FAQ: () => <div>Mocked FAQ</div>,
}));

jest.mock('../HomeComponents/Tasks/Tasks', () => ({
  Tasks: () => <div>Mocked Tasks</div>,
}));

jest.mock('../HomeComponents/Tasks/hooks', () => ({
  fetchTaskwarriorTasks: (...args: any[]) => mockFetchTaskwarriorTasks(...args),
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
    success: (...args: any[]) => mockToastSuccess(...args),
  },
}));

jest.mock('driver.js', () => {
  return {
    driver: jest.fn((config) => {
      lastDriverConfig = config;
      return {
        drive: mockDrive,
        destroy: mockDestroy,
        isActive: jest.fn(() => true),
      };
    }),
  };
});

beforeEach(() => {
  mockSocket = {
    onclose: null,
    onmessage: null,
    onerror: null,
    close: jest.fn(),
  };

  (global as any).WebSocket = jest.fn(() => mockSocket);
});

jest.mock('react-router', () => ({
  useNavigate: () => mockedNavigate,
}));

jest.mock('@/components/utils/URLs', () => ({
  url: {
    backendURL: 'http://mocked-backend-url/',
    containerOrigin: 'http://mocked-origin/',
    frontendURL: 'http://mocked-frontend-url/',
  },
  getWebSocketURL: (path: string) => `ws://mocked-backend-url/${path}`,
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        picture: 'mocked-picture-url',
        email: 'mocked-email',
        encryption_secret: 'mocked-encryption-secret',
        uuid: 'mocked-uuid',
        name: 'mocked-name',
      }),
  })
) as jest.Mock;

describe('HomePage', () => {
  beforeEach(() => {
    mockDestroy.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  it('renders correctly when user info is fetched successfully', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Mocked Navbar')).toBeInTheDocument();
      expect(screen.getByText('Mocked Hero')).toBeInTheDocument();
      expect(screen.getByText('Mocked Tasks')).toBeInTheDocument();
      expect(screen.getByText('Mocked SetupGuide')).toBeInTheDocument();
      expect(screen.getByText('Mocked FAQ')).toBeInTheDocument();
      expect(screen.getByText('Mocked Footer')).toBeInTheDocument();
    });
  });

  it('renders session expired message when user info fetch fails', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
      })
    );

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Session has been expired.')).toBeInTheDocument();
    });
  });

  it('navigates to home page on fetch error', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject('Fetch error')
    );

    render(<HomePage />);

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/');
    });
  });

  // Tasks Fetching Tests

  describe('Task Fetching', () => {
    it('calls fetchTaskwarriorTasks with correct parameters when user info is loaded', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(mockFetchTaskwarriorTasks).toHaveBeenCalledTimes(1);
        expect(mockFetchTaskwarriorTasks).toHaveBeenCalledWith({
          email: 'mocked-email',
          encryptionSecret: 'mocked-encryption-secret',
          UUID: 'mocked-uuid',
          backendURL: 'http://mocked-backend-url/',
        });
      });
    });

    it('updates tasks state when fetchTaskwarriorTasks returns data', async () => {
      const mockTasks = [
        { id: 1, description: 'Test task 1' },
        { id: 2, description: 'Test task 2' },
      ];
      mockFetchTaskwarriorTasks.mockResolvedValueOnce(mockTasks);

      render(<HomePage />);

      await waitFor(() => {
        expect(receivedNavbarProps.email).toBe('mocked-email');
        expect(receivedNavbarProps.encryptionSecret).toBe(
          'mocked-encryption-secret'
        );
        expect(receivedNavbarProps.UUID).toBe('mocked-uuid');
        expect(receivedNavbarProps.tasks).toEqual(mockTasks);
      });
    });

    it('sets tasks to empty array when fetchTaskwarriorTasks returns null', async () => {
      mockFetchTaskwarriorTasks.mockResolvedValueOnce(null);

      render(<HomePage />);

      await waitFor(() => {
        expect(receivedNavbarProps.tasks).toEqual([]);
      });
    });

    it('handles fetchTaskwarriorTasks error with toast.error and resets loading state', async () => {
      mockFetchTaskwarriorTasks.mockRejectedValueOnce(new Error('Test error'));

      render(<HomePage />);

      await waitFor(() => {
        expect(receivedNavbarProps.isLoading).toBe(false);
        expect(mockToastError).toHaveBeenCalled();
      });
    });

    it('toggles loading state correctly during task fetch', async () => {
      const mockTasks = [
        { id: 1, description: 'Test task 1' },
        { id: 2, description: 'Test task 2' },
      ];

      // 1. Create a promise and keep its "resolve" function
      let resolveTasks: ((value: any) => void) | undefined;

      const tasksPromise = new Promise((resolve) => {
        resolveTasks = resolve;
      });

      // 2. Make the mock return THIS promise instead of resolving immediately
      mockFetchTaskwarriorTasks.mockReturnValueOnce(tasksPromise);

      render(<HomePage />);

      // 3. While the promise is pending, isLoading should be true
      await waitFor(() => {
        expect(receivedNavbarProps.isLoading).toBe(true);
      });

      // 4. Simulate the end of the request
      resolveTasks!(mockTasks);

      // 5. After the request finishes, isLoading should be false
      await waitFor(() => {
        expect(receivedNavbarProps.isLoading).toBe(false);
      });
    });
  });

  // WebSocket Tests
  describe('WebSocket Behavior', () => {
    it('creates WebSocket with the correct URL', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalledTimes(1);
        expect((global as any).WebSocket).toHaveBeenCalledWith(
          'ws://mocked-backend-url/ws?clientID=mocked-uuid'
        );
      });
    });

    it('does not create the WebSocket when userInfo is missing', async () => {
      //Mock fetch to return null user info
      (fetch as jest.Mock).mockImplementationOnce(() => {
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(null),
        });
      });

      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).not.toHaveBeenCalled();
      });
    });

    it('does not create the WebSocket when userInfo.uuid is missing', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() => {
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              picture: 'mocked-picture',
              email: 'mocked-email',
              encryptionSecret: 'mocked-encryption-secret',
              name: 'mock-name',
              uuid: null,
            }),
        });
      });

      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).not.toHaveBeenCalled();
      });
    });

    it('refreshes tasks when WebSocket receives a success status message', async () => {
      mockFetchTaskwarriorTasks.mockResolvedValue([]);

      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalledTimes(1);
      });

      const messageEvent = {
        data: JSON.stringify({ status: 'success' }),
      };

      mockSocket.onmessage(messageEvent);

      await waitFor(() => {
        expect(mockFetchTaskwarriorTasks).toHaveBeenCalledTimes(2);
      });
    });

    test.each([
      { job: 'Add Task' },
      { job: 'Edit Task' },
      { job: 'Delete Task' },
      { job: 'Complete Task' },
    ])(
      'shows success toast when WebSocket receives success with job "%s"',
      async ({ job }) => {
        mockFetchTaskwarriorTasks.mockResolvedValueOnce([]);

        render(<HomePage />);

        await waitFor(() => {
          expect((global as any).WebSocket).toHaveBeenCalledTimes(1);
        });

        const messageEvent = {
          data: JSON.stringify({
            status: 'success',
            job,
          }),
        };

        mockSocket.onmessage(messageEvent);

        await waitFor(() => {
          expect(mockToastSuccess).toHaveBeenCalled();
        });
      }
    );

    it('shows error toast when WebSocket receives a failure status message', async () => {
      mockFetchTaskwarriorTasks.mockResolvedValueOnce([]);

      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalledTimes(1);
      });

      const messageEvent = {
        data: JSON.stringify({
          status: 'failure',
          job: 'Any Action',
        }),
      };

      mockSocket.onmessage(messageEvent);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });
    });

    it('handles malformed JSON in WebSocket message without crashing', async () => {
      mockFetchTaskwarriorTasks.mockResolvedValueOnce([]);

      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalledTimes(1);
      });

      mockSocket.onmessage({ data: 'NOT_JSON' });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      });

      expect(mockToastError).not.toHaveBeenCalled();
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });

    it('closes WebSocket on Component unmount', async () => {
      mockFetchTaskwarriorTasks.mockResolvedValueOnce([]);

      const { unmount } = render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalledTimes(1);
      });

      unmount();

      expect(mockSocket.close).toHaveBeenCalledTimes(1);
    });

    it('handles success status with unknown job without throwing', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalled();
      });

      const event = {
        data: JSON.stringify({ status: 'success', job: 'UnknownJob' }),
      };

      expect(() => mockSocket.onmessage(event)).not.toThrow();
    });

    it('handles success status with no job field gracefully', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalled();
      });

      const event = {
        data: JSON.stringify({ status: 'success' }),
      };

      mockSocket.onmessage(event);

      expect(mockToastSuccess).not.toHaveBeenCalled();
      expect(mockToastError).not.toHaveBeenCalled();
    });

    it('handles WebSocket error event without crashing', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalled();
      });

      expect(() => mockSocket.onerror('test error')).not.toThrow();
    });

    it('handles WebSocket onclose without crashing', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalled();
      });

      expect(() => mockSocket.onclose()).not.toThrow();
    });
  });

  // Onboarding Tour Tests

  describe('Onboarding Tour', () => {
    it('does not start the tour if userInfo.email is missing', async () => {
      jest.useFakeTimers();
      localStorage.clear();

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            uuid: 'mocked-uuid',
            name: 'Mock User',
            encryption_secret: 'mock-secret',
            picture: 'mocked-pic',
            // email missing
          }),
      });

      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).not.toHaveBeenCalled();
      });

      expect(mockDrive).not.toHaveBeenCalled();

      expect(localStorage.length).toBe(0);

      jest.useRealTimers();
    });

    it('starts the tour for first-time users', async () => {
      jest.useFakeTimers();

      mockFetchTaskwarriorTasks.mockResolvedValueOnce([]);

      localStorage.clear();
      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalledTimes(1);
      });

      jest.runAllTimers();

      expect(mockDrive).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('does not start the tour multiple times if already started', async () => {
      jest.useFakeTimers();
      localStorage.clear();

      const { rerender } = render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalledTimes(1);
      });

      jest.runAllTimers();

      const initialDriveCalls = mockDrive.mock.calls.length;

      rerender(<HomePage />);

      jest.runAllTimers();

      expect(mockDrive).toHaveBeenCalledTimes(initialDriveCalls);

      jest.useRealTimers();
    });

    it('does NOT start the tour if already seen', async () => {
      mockFetchTaskwarriorTasks.mockResolvedValueOnce([]);

      localStorage.setItem('ccsync-home-tour-mocked-email', 'seen');

      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalledTimes(1);
      });

      jest.runAllTimers();

      expect(mockDrive).not.toHaveBeenCalled();
    });

    it('marks tour as seen when onDestroyed is called', async () => {
      mockFetchTaskwarriorTasks.mockResolvedValueOnce([]);

      localStorage.clear();

      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalledTimes(1);
      });

      jest.runAllTimers();

      expect(lastDriverConfig).not.toBeNull();

      lastDriverConfig.onDestroyed();

      expect(localStorage.getItem('ccsync-home-tour-mocked-email')).toBe(
        'seen'
      );
    });

    it('marks tour as seen when onCloseClick is called', async () => {
      mockFetchTaskwarriorTasks.mockResolvedValueOnce([]);

      localStorage.clear();

      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalledTimes(1);
      });

      jest.runAllTimers();

      expect(lastDriverConfig).not.toBeNull();

      lastDriverConfig.onCloseClick();

      expect(localStorage.getItem('ccsync-home-tour-mocked-email')).toBe(
        'seen'
      );

      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });

    it('clears the tour timeout on component unmount', async () => {
      mockFetchTaskwarriorTasks.mockResolvedValueOnce([]);

      localStorage.clear();

      const { unmount } = render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalledTimes(1);
      });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(mockDrive).not.toHaveBeenCalled();
    });

    it('adds skip button inside popover and handles its click', async () => {
      jest.useFakeTimers();
      localStorage.clear();

      mockFetchTaskwarriorTasks.mockResolvedValueOnce([]);

      render(<HomePage />);

      await waitFor(() => {
        expect((global as any).WebSocket).toHaveBeenCalledTimes(1);
      });

      jest.runAllTimers();

      const mockPopover = {
        footerButtons: document.createElement('div'),
      };

      lastDriverConfig.onPopoverRender(mockPopover);

      const skipBtn = mockPopover.footerButtons.querySelector(
        '[data-driver-skip-button]'
      ) as HTMLButtonElement;
      expect(skipBtn).toBeTruthy();
      expect(skipBtn?.textContent).toBe('Skip');

      skipBtn?.click();

      expect(localStorage.getItem('ccsync-home-tour-mocked-email')).toBe(
        'seen'
      );

      expect(mockDestroy).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('does not add skip button twice', () => {
      const mockPopover = {
        footerButtons: document.createElement('div'),
      };

      lastDriverConfig.onPopoverRender(mockPopover);
      lastDriverConfig.onPopoverRender(mockPopover);

      const skipButtons = mockPopover.footerButtons.querySelectorAll(
        '[data-driver-skip-button]'
      );

      expect(skipButtons.length).toBe(1);
    });
  });

  describe('Rendering', () => {
    it('renders all required section IDs', async () => {
      mockFetchTaskwarriorTasks.mockResolvedValueOnce([]);

      render(<HomePage />);

      // Wait for user info to load
      await waitFor(() => {
        expect(document.getElementById('home-navbar')).toBeTruthy();
      });

      expect(document.getElementById('home-navbar')).toBeTruthy();
      expect(document.getElementById('home-hero')).toBeTruthy();
      expect(document.getElementById('home-tasks')).toBeTruthy();
      expect(document.getElementById('home-setup-guide')).toBeTruthy();
      expect(document.getElementById('home-faq')).toBeTruthy();
    });
  });
});

describe('HomePage Component using Snapshot', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with user info loaded', async () => {
    const { asFragment } = render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Mocked Navbar')).toBeInTheDocument();
    });

    expect(asFragment()).toMatchSnapshot('homepage-with-user-info');
  });

  it('renders correctly when session is expired', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
      })
    );

    const { asFragment } = render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Session has been expired.')).toBeInTheDocument();
    });

    expect(asFragment()).toMatchSnapshot('homepage-session-expired');
  });
});
