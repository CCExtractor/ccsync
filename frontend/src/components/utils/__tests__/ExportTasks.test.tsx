import { exportTasksAsJSON, exportTasksAsTXT } from '../ExportTasks';
import { Task } from '../types';
import { toast } from 'react-toastify';

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    info: jest.fn(),
  },
}));

// Mock URL methods
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
});

// Mock DOM methods
const mockClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockCreateElement = jest.fn(() => ({
  click: mockClick,
  href: '',
  download: '',
}));

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
});

describe('ExportTasks', () => {
  const mockTasks: Task[] = [
    {
      id: 1,
      description: 'Test task 1',
      status: 'pending',
      project: 'TestProject',
      tags: ['tag1', 'tag2'],
      uuid: 'test-uuid-1',
      entry: '2024-01-01T10:00:00Z',
      due: '2024-01-02T10:00:00Z',
      urgency: 5,
      priority: 'H',
      annotations: [],
      start: '',
      end: '',
      modified: '2024-01-01T10:00:00Z',
      wait: '',
      depends: [],
      rtype: '',
      recur: '',
      email: '',
    },
    {
      id: 2,
      description: 'Test task 2',
      status: 'completed',
      project: '',
      tags: [],
      uuid: 'test-uuid-2',
      entry: '2024-01-01T11:00:00Z',
      due: '',
      urgency: 3,
      priority: 'M',
      annotations: [],
      start: '',
      end: '',
      modified: '2024-01-01T11:00:00Z',
      wait: '',
      depends: [],
      rtype: '',
      recur: '',
      email: '',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('mock-blob-url');
  });

  describe('exportTasksAsJSON', () => {
    it('should export tasks as JSON file', () => {
      exportTasksAsJSON(mockTasks);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
    });

    it('should create correct JSON blob', () => {
      exportTasksAsJSON(mockTasks);

      const blobCall = mockCreateObjectURL.mock.calls[0][0];
      expect(blobCall.type).toBe('application/json');
    });

    it('should set correct download filename', () => {
      const mockElement = { click: mockClick, href: '', download: '' };
      mockCreateElement.mockReturnValue(mockElement);

      exportTasksAsJSON(mockTasks);

      expect(mockElement.download).toBe('tasks.json');
      expect(mockElement.href).toBe('mock-blob-url');
    });

    it('should show toast and return early for empty tasks', () => {
      exportTasksAsJSON([]);

      expect(toast.info).toHaveBeenCalledWith('Tasks list is empty!');
      expect(mockCreateElement).not.toHaveBeenCalled();
    });

    it('should show toast and return early for null tasks', () => {
      exportTasksAsJSON(null as any);

      expect(toast.info).toHaveBeenCalledWith('Tasks list is empty!');
      expect(mockCreateElement).not.toHaveBeenCalled();
    });
  });

  describe('exportTasksAsTXT', () => {
    it('should export tasks as TXT file', () => {
      exportTasksAsTXT(mockTasks);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
    });

    it('should create correct TXT blob', () => {
      exportTasksAsTXT(mockTasks);

      const blobCall = mockCreateObjectURL.mock.calls[0][0];
      expect(blobCall.type).toBe('text/plain');
    });

    it('should set correct download filename', () => {
      const mockElement = { click: mockClick, href: '', download: '' };
      mockCreateElement.mockReturnValue(mockElement);

      exportTasksAsTXT(mockTasks);

      expect(mockElement.download).toBe('tasks.txt');
      expect(mockElement.href).toBe('mock-blob-url');
    });

    it('should format TXT content correctly', () => {
      const mockBlob = jest.fn();
      global.Blob = mockBlob;

      exportTasksAsTXT(mockTasks);

      const blobContent = mockBlob.mock.calls[0][0][0];
      expect(blobContent).toContain('Your TaskWarrior Tasks');
      expect(blobContent).toContain('Description: Test task 1');
      expect(blobContent).toContain('Status: pending');
      expect(blobContent).toContain('Project: TestProject');
      expect(blobContent).toContain('Tags: tag1, tag2');
      expect(blobContent).toContain('UUID: test-uuid-1');
    });

    it('should handle tasks with no project and tags', () => {
      const mockBlob = jest.fn();
      global.Blob = mockBlob;

      exportTasksAsTXT(mockTasks);

      const blobContent = mockBlob.mock.calls[0][0][0];
      expect(blobContent).toContain('Project: None');
      expect(blobContent).toContain('Tags: None');
      expect(blobContent).toContain('Due: None');
    });

    it('should show toast and return early for empty tasks', () => {
      exportTasksAsTXT([]);

      expect(toast.info).toHaveBeenCalledWith('Tasks list is empty!');
      expect(mockCreateElement).not.toHaveBeenCalled();
    });

    it('should show toast and return early for null tasks', () => {
      exportTasksAsTXT(null as any);

      expect(toast.info).toHaveBeenCalledWith('Tasks list is empty!');
      expect(mockCreateElement).not.toHaveBeenCalled();
    });
  });
});
