import { toast } from 'react-toastify';
import { tasksCollection } from '@/lib/controller';
import { deleteDoc, getDocs } from 'firebase/firestore';
import {
  handleLogout,
  syncTasksWithTwAndDb,
  deleteAllTasks,
  Props,
} from '../navbar-utils';

// Mock external dependencies
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('firebase/firestore', () => ({
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock('@/lib/controller', () => ({
  tasksCollection: {},
}));

jest.mock('@/components/utils/URLs.ts', () => ({
  url: {
    backendURL: 'http://localhost:3000/',
  },
}));

global.fetch = jest.fn();

describe('navbar-utils', () => {
  const mockProps: Props = {
    imgurl: 'http://example.com/image.png',
    email: 'test@example.com',
    encryptionSecret: 'secret',
    origin: 'http://localhost:3000',
    UUID: '1234-5678',
  };

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

  describe('syncTasksWithTwAndDb', () => {
    it('should sync tasks and show success toast', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [{ id: '1', data: () => ({}) }],
      });
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue([{ uuid: '1' }]),
      });

      await syncTasksWithTwAndDb(mockProps);

      expect(getDocs).toHaveBeenCalledWith(tasksCollection);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/tasks?email=test%40example.com&encryptionSecret=secret&UUID=1234-5678',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(toast.success).toHaveBeenCalledWith(
        'Tasks synced succesfully!',
        expect.any(Object)
      );
    });

    it('should show error toast if server is down', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [{ id: '1', data: () => ({}) }],
      });
      (fetch as jest.Mock).mockResolvedValue({ ok: false });

      await syncTasksWithTwAndDb(mockProps);

      expect(toast.error).toHaveBeenCalledWith(
        'Server is down. Failed to sync tasks',
        expect.any(Object)
      );
    });

    it('should log an error if there is an exception', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      await syncTasksWithTwAndDb(mockProps);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteAllTasks', () => {
    it('should delete all tasks and show success toast', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [{ id: '1', data: () => ({ email: 'test@example.com' }) }],
      });

      await deleteAllTasks(mockProps);

      expect(getDocs).toHaveBeenCalledWith(tasksCollection);
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should show error toast if there is an exception', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      await deleteAllTasks(mockProps);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting tasks for test@example.com:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
