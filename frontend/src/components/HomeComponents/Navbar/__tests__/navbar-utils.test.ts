import { Task } from '@/components/utils/types';
import { handleLogout, deleteAllTasks } from '../navbar-utils';

// Mock external dependencies
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('dexie', () => {
  return jest.fn().mockImplementation(() => ({
    version: jest.fn().mockReturnThis(),
    stores: jest.fn().mockReturnThis(),
    table: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      delete: jest.fn().mockResolvedValue(undefined), // simulates delete success
    }),
  }));
});

jest.mock('@/components/utils/URLs.ts', () => ({
  url: {
    backendURL: 'http://localhost:3000/',
  },
}));

global.fetch = jest.fn();

describe('navbar-utils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleLogout', () => {
    it('should call fetch with correct URL and redirect on success', async () => {
      (fetch as jest.Mock).mockResolvedValue({ ok: true });

      await handleLogout();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      expect(window.location.href).toBe('http://localhost/');
    });

    it('should log an error if fetch fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (fetch as jest.Mock).mockResolvedValue({ ok: false });

      await handleLogout();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to logout');
      consoleErrorSpy.mockRestore();
    });

    it('should log an error if fetch throws an exception', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await handleLogout();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error logging out:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteAllTasks', () => {
    it('should delete tasks without error', async () => {
      const props = {
        imgurl: '',
        email: 'test@example.com',
        encryptionSecret: '',
        origin: '',
        UUID: '',
        tasks: [] as Task[] | null,
      };

      await expect(deleteAllTasks(props)).resolves.toBeUndefined();
    });
  });
});
