import {
  exportReportToCSV,
  exportChartToPNG,
  ReportData,
} from '../report-download-utils';
import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';

// Mock html2canvas
jest.mock('html2canvas');

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('report-download-utils', () => {
  let mockCreateObjectURL: jest.Mock;
  let mockRevokeObjectURL: jest.Mock;
  let mockClick: jest.Mock;
  let mockLink: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock URL methods
    mockCreateObjectURL = jest.fn(() => 'mock-url');
    mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock link element
    mockClick = jest.fn();
    mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: mockClick,
    };

    // Mock createElement to return our mock link
    const originalCreateElement = document.createElement.bind(document);
    jest
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as any;
        }
        return originalCreateElement(tagName);
      });

    // Mock appendChild and removeChild
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('exportReportToCSV', () => {
    const mockData: ReportData[] = [
      { name: 'Today', completed: 5, ongoing: 3 },
    ];

    it('creates blob with correct MIME type', () => {
      exportReportToCSV(mockData, 'Daily Report');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blob = mockCreateObjectURL.mock.calls[0][0];
      expect(blob.type).toBe('text/csv;charset=utf-8;');
    });

    it('generates filename with report type and date', () => {
      const dateSpy = jest
        .spyOn(Date.prototype, 'toISOString')
        .mockReturnValue('2023-11-18T12:00:00.000Z');

      exportReportToCSV(mockData, 'Daily Report');

      expect(mockLink.download).toContain('ccsync-');
      expect(mockLink.download).toContain('daily-report');
      expect(mockLink.download).toContain('2023-11-18');
      expect(mockLink.download).toContain('.csv');

      dateSpy.mockRestore();
    });

    it('triggers file download', () => {
      exportReportToCSV(mockData, 'Daily Report');

      expect(document.body.appendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });

    it('cleans up URL after download', () => {
      exportReportToCSV(mockData, 'Daily Report');

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
    });

    it('shows success toast notification', () => {
      exportReportToCSV(mockData, 'Daily Report');

      expect(toast.success).toHaveBeenCalledWith(
        'Daily Report Report exported to CSV successfully!',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
    });

    it('handles multiple data entries', () => {
      const multiData: ReportData[] = [
        { name: 'Monday', completed: 5, ongoing: 3 },
        { name: 'Tuesday', completed: 7, ongoing: 2 },
        { name: 'Wednesday', completed: 4, ongoing: 5 },
      ];

      exportReportToCSV(multiData, 'Weekly Report');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('handles empty data array', () => {
      exportReportToCSV([], 'Empty Report');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('handles zero values in data', () => {
      const zeroData: ReportData[] = [
        { name: 'Today', completed: 0, ongoing: 0 },
      ];

      exportReportToCSV(zeroData, 'Daily Report');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('handles large numbers in data', () => {
      const largeData: ReportData[] = [
        { name: 'Today', completed: 99999, ongoing: 88888 },
      ];

      exportReportToCSV(largeData, 'Daily Report');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('handles special characters in report name', () => {
      exportReportToCSV(mockData, 'Daily & Weekly Report (2023)');

      expect(toast.success).toHaveBeenCalledWith(
        'Daily & Weekly Report (2023) Report exported to CSV successfully!',
        expect.any(Object)
      );
    });

    it('shows error toast on exception', () => {
      // Suppress console.error for this test
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Force an error by mocking Blob constructor to throw
      const originalBlob = global.Blob;
      global.Blob = jest.fn(() => {
        throw new Error('Blob creation failed');
      }) as any;

      exportReportToCSV(mockData, 'Daily Report');

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to export CSV. Please try again.',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );

      // Restore
      global.Blob = originalBlob;
      consoleError.mockRestore();
    });
  });

  describe('exportChartToPNG', () => {
    let mockCanvas: any;
    let mockElement: HTMLElement;

    beforeEach(() => {
      // Mock canvas
      mockCanvas = {
        toBlob: jest.fn((callback) => {
          const blob = new Blob(['mock-image-data'], { type: 'image/png' });
          callback(blob);
        }),
      };

      // Mock element
      mockElement = document.createElement('div');
      mockElement.id = 'test-chart';
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

      // Mock html2canvas to return mockCanvas
      (html2canvas as jest.Mock).mockResolvedValue(mockCanvas);
    });

    it('finds element by ID and creates canvas', async () => {
      await exportChartToPNG('test-chart', 'Daily Report');

      expect(document.getElementById).toHaveBeenCalledWith('test-chart');
      expect(html2canvas).toHaveBeenCalledWith(
        mockElement,
        expect.objectContaining({
          backgroundColor: '#1c1c1c',
          scale: 2,
          logging: false,
          useCORS: true,
        })
      );
    });

    it('throws error if element not found', async () => {
      // Suppress console.error for this test
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      jest.spyOn(document, 'getElementById').mockReturnValue(null);

      await exportChartToPNG('non-existent-chart', 'Daily Report');

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to export PNG. Please try again.',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );

      consoleError.mockRestore();
    });

    it('creates canvas with correct options', async () => {
      await exportChartToPNG('test-chart', 'Daily Report');

      expect(html2canvas).toHaveBeenCalledWith(
        mockElement,
        expect.objectContaining({
          backgroundColor: '#1c1c1c',
          scale: 2,
          logging: false,
          useCORS: true,
        })
      );
    });

    it('converts canvas to blob', async () => {
      await exportChartToPNG('test-chart', 'Daily Report');

      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/png'
      );
    });

    it('generates filename with report type and date', async () => {
      const dateSpy = jest
        .spyOn(Date.prototype, 'toISOString')
        .mockReturnValue('2023-11-18T12:00:00.000Z');

      await exportChartToPNG('test-chart', 'Daily Report');

      expect(mockLink.download).toContain('ccsync-');
      expect(mockLink.download).toContain('daily-report');
      expect(mockLink.download).toContain('2023-11-18');
      expect(mockLink.download).toContain('.png');

      dateSpy.mockRestore();
    });

    it('triggers file download', async () => {
      await exportChartToPNG('test-chart', 'Daily Report');

      expect(document.body.appendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });

    it('cleans up URL after download', async () => {
      await exportChartToPNG('test-chart', 'Daily Report');

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
    });

    it('shows success toast notification', async () => {
      await exportChartToPNG('test-chart', 'Daily Report');

      expect(toast.success).toHaveBeenCalledWith(
        'Daily Report Report exported to PNG successfully!',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
    });

    it('handles canvas toBlob returning null', async () => {
      // Suppress console.error for this test
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockCanvas.toBlob = jest.fn((callback) => callback(null));

      await exportChartToPNG('test-chart', 'Daily Report');

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to export PNG. Please try again.',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );

      consoleError.mockRestore();
    });

    it('handles html2canvas rejection', async () => {
      // Suppress console.error for this test
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      (html2canvas as jest.Mock).mockRejectedValue(
        new Error('Canvas creation failed')
      );

      await exportChartToPNG('test-chart', 'Daily Report');

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to export PNG. Please try again.',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );

      consoleError.mockRestore();
    });

    it('handles special characters in chart ID', async () => {
      const specialElement = document.createElement('div');
      specialElement.id = 'chart-2023-11-18';
      jest.spyOn(document, 'getElementById').mockReturnValue(specialElement);

      await exportChartToPNG('chart-2023-11-18', 'Report');

      expect(html2canvas).toHaveBeenCalledWith(
        specialElement,
        expect.any(Object)
      );
    });

    it('handles special characters in report title', async () => {
      await exportChartToPNG('test-chart', 'Report: Daily & Weekly (2023)');

      expect(toast.success).toHaveBeenCalledWith(
        'Report: Daily & Weekly (2023) Report exported to PNG successfully!',
        expect.any(Object)
      );
    });

    it('creates blob with correct MIME type', async () => {
      await exportChartToPNG('test-chart', 'Daily Report');

      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/png'
      );
    });
  });

  describe('Filename Generation', () => {
    const mockData: ReportData[] = [
      { name: 'Today', completed: 5, ongoing: 3 },
    ];

    it('generates consistent filenames for CSV', () => {
      const dateSpy = jest
        .spyOn(Date.prototype, 'toISOString')
        .mockReturnValue('2023-11-18T12:00:00.000Z');

      exportReportToCSV(mockData, 'Daily Report');
      const download1 = mockLink.download;

      // Reset mock link
      mockLink.download = '';

      exportReportToCSV(mockData, 'Daily Report');
      const download2 = mockLink.download;

      expect(download1).toBe(download2);

      dateSpy.mockRestore();
    });

    it('converts report type to lowercase and replaces spaces with hyphens', () => {
      const dateSpy = jest
        .spyOn(Date.prototype, 'toISOString')
        .mockReturnValue('2023-11-18T12:00:00.000Z');

      exportReportToCSV(mockData, 'Weekly Report');

      expect(mockLink.download).toContain('weekly-report');
      expect(mockLink.download).not.toContain('Weekly Report');

      dateSpy.mockRestore();
    });

    it('includes date in YYYY-MM-DD format', () => {
      const dateSpy = jest
        .spyOn(Date.prototype, 'toISOString')
        .mockReturnValue('2023-11-18T12:00:00.000Z');

      exportReportToCSV(mockData, 'Daily Report');

      expect(mockLink.download).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(mockLink.download).toContain('2023-11-18');

      dateSpy.mockRestore();
    });

    it('includes "ccsync" prefix in filename', () => {
      exportReportToCSV(mockData, 'Daily Report');

      expect(mockLink.download).toContain('ccsync-');
    });
  });
});
