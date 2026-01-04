import { Task } from '@/components/utils/types';
import { handleLogout, deleteAllTasks } from '../navbar-utils';
import { toast } from 'react-toastify';

// Toast mock
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    update: jest.fn(),
  },
}));

// Dexie mock
jest.mock('dexie', () => {
  const mockCount = jest.fn();
  const mockDelete = jest.fn();

  const DexieMock = jest.fn().mockImplementation(() => ({
    version: jest.fn().mockReturnThis(),
    stores: jest.fn().mockReturnThis(),
    table: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      count: mockCount,
      delete: mockDelete,
    }),
  }));

  return Object.assign(DexieMock, {
    __mockCount: mockCount,
    __mockDelete: mockDelete,
  });
});

// URL mock
jest.mock('@/components/utils/URLs.ts', () => ({
  url: {
    backendURL: 'http://localhost:3000/',
  },
}));

global.fetch = jest.fn();

describe('navbar-utils', () => {
  const mockToast = toast as jest.Mocked<typeof toast>;
  const Dexie = require('dexie');
  const mockCount = Dexie.__mockCount as jest.Mock;
  const mockDelete = Dexie.__mockDelete as jest.Mock;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    mockToast.info.mockReturnValue('toast-id' as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleLogout', () => {
    it('calls fetch with correct URL and redirects on success', async () => {
      (fetch as jest.Mock).mockResolvedValue({ ok: true });

      await handleLogout();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      expect(window.location.href).toBe('http://localhost/');
    });

    it('logs error when response is not ok', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();

      (fetch as jest.Mock).mockResolvedValue({ ok: false });

      await handleLogout();

      expect(spy).toHaveBeenCalledWith('Failed to logout');
      spy.mockRestore();
    });

    it('logs error when fetch throws exception', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();

      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await handleLogout();

      expect(spy).toHaveBeenCalledWith('Error logging out:', expect.any(Error));
      spy.mockRestore();
    });
  });

  describe('deleteAllTasks', () => {
    const props = {
      imgurl: '',
      email: 'test@example.com',
      encryptionSecret: '',
      origin: '',
      UUID: '',
      tasks: [] as Task[] | null,
    };

    it('shows error toast when no tasks exist', async () => {
      mockCount.mockResolvedValueOnce(0);

      await deleteAllTasks(props);

      expect(mockToast.info).toHaveBeenCalled();
      expect(mockToast.update).toHaveBeenCalledWith(
        'toast-id',
        expect.objectContaining({ type: 'error' })
      );
    });

    it('deletes tasks and shows success toast when tasks exist', async () => {
      mockCount.mockResolvedValueOnce(3);
      mockDelete.mockResolvedValueOnce(undefined);

      await deleteAllTasks(props);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockToast.update).toHaveBeenCalledWith(
        'toast-id',
        expect.objectContaining({ type: 'success' })
      );
    });

    it('shows error toast when deletion fails', async () => {
      mockCount.mockResolvedValueOnce(2);
      mockDelete.mockRejectedValueOnce(new Error('DB error'));

      await deleteAllTasks(props);

      expect(mockToast.update).toHaveBeenCalledWith(
        'toast-id',
        expect.objectContaining({ type: 'error' })
      );
    });
  });
});
