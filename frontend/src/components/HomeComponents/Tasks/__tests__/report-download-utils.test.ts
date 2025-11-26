import {
  exportReportToCSV,
  exportChartToPNG,
  ReportData,
} from '../report-download-utils';
import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';

jest.mock('html2canvas');
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('report-download-utils', () => {
  let mockLink: Partial<HTMLAnchorElement>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn() as any;

    mockLink = {
      href: '',
      download: '',
      style: {} as CSSStyleDeclaration,
      click: jest.fn(),
    };

    const originalCreateElement = document.createElement.bind(document);
    jest
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as HTMLAnchorElement;
        }
        return originalCreateElement(tagName);
      });

    jest
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => null as any);
    jest
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => null as any);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('exportReportToCSV', () => {
    const mockData: ReportData[] = [
      { name: 'Today', completed: 5, ongoing: 3 },
      { name: 'This Week', completed: 10, ongoing: 7 },
    ];

    it('triggers download and shows success toast', () => {
      exportReportToCSV(mockData, 'Daily Report');

      expect(mockLink.click).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        'Daily Report Report exported to CSV successfully!',
        expect.objectContaining({
          position: 'bottom-right',
          autoClose: 3000,
        })
      );
    });

    it('sets correct filename pattern', () => {
      exportReportToCSV(mockData, 'Weekly Report');

      expect(mockLink.download).toMatch(
        /ccsync-weekly-report-report-\d{4}-\d{2}-\d{2}\.csv/
      );
    });

    it('cleans up DOM and URL resources', () => {
      exportReportToCSV(mockData, 'Monthly Report');

      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('handles empty data array gracefully', () => {
      exportReportToCSV([], 'Empty Report');

      expect(toast.success).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('handles special characters in report name', () => {
      exportReportToCSV(mockData, 'Report With Spaces');

      expect(mockLink.download).toMatch(
        /ccsync-report-with-spaces-report-\d{4}-\d{2}-\d{2}\.csv/
      );
    });

    it('creates blob with correct type', () => {
      const blobSpy = jest.spyOn(global, 'Blob');
      exportReportToCSV(mockData, 'Test Report');

      expect(blobSpy).toHaveBeenCalledWith(expect.any(Array), {
        type: 'text/csv;charset=utf-8;',
      });
    });
  });

  describe('exportChartToPNG', () => {
    const mockCanvas = {
      toBlob: jest.fn((callback) => {
        callback(new Blob(['fake-image'], { type: 'image/png' }));
      }),
    };

    beforeEach(() => {
      (html2canvas as jest.Mock).mockResolvedValue(mockCanvas);
    });

    it('finds and processes DOM element', async () => {
      const mockElement = document.createElement('div');
      mockElement.id = 'test-chart';
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

      await exportChartToPNG('test-chart', 'Test Report');

      expect(document.getElementById).toHaveBeenCalledWith('test-chart');
      expect(html2canvas).toHaveBeenCalledWith(mockElement, {
        backgroundColor: '#1c1c1c',
        scale: 2,
        logging: false,
        useCORS: true,
      });
    });

    it('triggers download and shows success toast', async () => {
      const mockElement = document.createElement('div');
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

      await exportChartToPNG('chart-id', 'Daily Report');

      expect(mockLink.click).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        'Daily Report Report exported to PNG successfully!',
        expect.objectContaining({
          position: 'bottom-right',
          autoClose: 3000,
        })
      );
    });

    it('sets correct filename pattern', async () => {
      const mockElement = document.createElement('div');
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

      await exportChartToPNG('chart-id', 'Weekly Report');

      expect(mockLink.download).toMatch(
        /ccsync-weekly-report-report-\d{4}-\d{2}-\d{2}\.png/
      );
    });

    it('cleans up resources after export', async () => {
      const mockElement = document.createElement('div');
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

      await exportChartToPNG('chart-id', 'Report');

      expect(document.body.removeChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('shows error when element not found', async () => {
      jest.spyOn(document, 'getElementById').mockReturnValue(null);

      await exportChartToPNG('non-existent', 'Report');

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to export PNG. Please try again.',
        expect.any(Object)
      );
      expect(html2canvas).not.toHaveBeenCalled();
    });

    it('handles html2canvas errors', async () => {
      const mockElement = document.createElement('div');
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);
      (html2canvas as jest.Mock).mockRejectedValue(new Error('Canvas error'));

      await exportChartToPNG('chart-id', 'Report');

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to export PNG. Please try again.',
        expect.objectContaining({
          position: 'bottom-right',
        })
      );
    });

    it('handles canvas.toBlob failure', async () => {
      const mockElement = document.createElement('div');
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

      const failingCanvas = {
        toBlob: jest.fn((callback) => callback(null)),
      };
      (html2canvas as jest.Mock).mockResolvedValue(failingCanvas);

      await exportChartToPNG('chart-id', 'Report');

      expect(toast.error).toHaveBeenCalled();
    });

    it('creates PNG blob correctly', async () => {
      const mockElement = document.createElement('div');
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

      await exportChartToPNG('chart-id', 'Report');

      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/png'
      );
    });
  });

  describe('Helper Functions', () => {
    const mockData: ReportData[] = [{ name: 'Test', completed: 1, ongoing: 2 }];

    it('generates date-stamped filenames', () => {
      exportReportToCSV(mockData, 'Test Report');

      const filename = mockLink.download as string;
      expect(filename).toContain('ccsync-');
      expect(filename).toContain('-report-');
      expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('converts spaces to hyphens in filenames', () => {
      exportReportToCSV(mockData, 'My Test Report');

      expect(mockLink.download).toContain('my-test-report');
    });

    it('uses lowercase for report type in filename', () => {
      exportReportToCSV(mockData, 'DAILY REPORT');

      expect(mockLink.download).toContain('daily-report');
    });
  });
});
