import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportChart } from '../ReportChart';
import * as reportDownloadUtils from '../report-download-utils';

// Mock the report download utilities
jest.mock('../report-download-utils', () => ({
  exportReportToCSV: jest.fn(),
  exportChartToPNG: jest.fn(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon">FileText</div>,
  Image: () => <div data-testid="image-icon">Image</div>,
  Loader2: () => <div data-testid="loader-icon">Loader2</div>,
}));

// Mock recharts
jest.mock('recharts', () => ({
  BarChart: ({ children }: any) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar">Bar</div>,
  XAxis: () => <div data-testid="x-axis">XAxis</div>,
  YAxis: () => <div data-testid="y-axis">YAxis</div>,
  Tooltip: () => <div data-testid="tooltip">Tooltip</div>,
  Legend: () => <div data-testid="legend">Legend</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid">CartesianGrid</div>,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

describe('ReportChart', () => {
  const mockData = [{ name: 'Today', completed: 5, ongoing: 3 }];

  const defaultProps = {
    data: mockData,
    title: 'Daily Report',
    chartId: 'daily-report-chart',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the chart with correct title', () => {
      render(<ReportChart {...defaultProps} />);
      expect(screen.getByText('Daily Report')).toBeInTheDocument();
    });

    it('renders the chart container with correct id', () => {
      const { container } = render(<ReportChart {...defaultProps} />);
      const chartContainer = container.querySelector('#daily-report-chart');
      expect(chartContainer).toBeInTheDocument();
    });

    it('renders CSV export button', () => {
      render(<ReportChart {...defaultProps} />);
      const csvButton = screen.getByTitle('Download as CSV');
      expect(csvButton).toBeInTheDocument();
    });

    it('renders PNG export button', () => {
      render(<ReportChart {...defaultProps} />);
      const pngButton = screen.getByTitle('Download as PNG');
      expect(pngButton).toBeInTheDocument();
    });

    it('renders recharts components', () => {
      render(<ReportChart {...defaultProps} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('renders with different chart titles', () => {
      const { rerender } = render(<ReportChart {...defaultProps} />);
      expect(screen.getByText('Daily Report')).toBeInTheDocument();

      rerender(
        <ReportChart
          {...defaultProps}
          title="Weekly Report"
          chartId="weekly-chart"
        />
      );
      expect(screen.getByText('Weekly Report')).toBeInTheDocument();
      expect(screen.queryByText('Daily Report')).not.toBeInTheDocument();
    });

    it('renders with empty data array', () => {
      render(<ReportChart {...defaultProps} data={[]} />);
      expect(screen.getByText('Daily Report')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('renders with multiple data entries', () => {
      const multiData = [
        { name: 'Monday', completed: 5, ongoing: 3 },
        { name: 'Tuesday', completed: 7, ongoing: 2 },
        { name: 'Wednesday', completed: 4, ongoing: 5 },
      ];
      render(<ReportChart {...defaultProps} data={multiData} />);
      expect(screen.getByText('Daily Report')).toBeInTheDocument();
    });
  });

  describe('CSV Export Functionality', () => {
    it('calls exportReportToCSV when CSV button is clicked', () => {
      render(<ReportChart {...defaultProps} />);
      const csvButton = screen.getByTitle('Download as CSV');

      fireEvent.click(csvButton);

      expect(reportDownloadUtils.exportReportToCSV).toHaveBeenCalledWith(
        mockData,
        'Daily Report'
      );
    });

    it('disables both buttons during PNG export', async () => {
      (reportDownloadUtils.exportChartToPNG as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ReportChart {...defaultProps} />);
      const pngButton = screen.getByTitle('Download as PNG');
      const csvButton = screen.getByTitle('Download as CSV');

      fireEvent.click(pngButton);

      // Both buttons are disabled during export (based on actual implementation)
      await waitFor(() => {
        expect(csvButton).toBeDisabled();
        expect(pngButton).toBeDisabled();
      });
    });

    it('calls exportReportToCSV with correct data for different report types', () => {
      const weeklyData = [{ name: 'This Week', completed: 20, ongoing: 10 }];
      render(
        <ReportChart
          data={weeklyData}
          title="Weekly Report"
          chartId="weekly-chart"
        />
      );

      const csvButton = screen.getByTitle('Download as CSV');
      fireEvent.click(csvButton);

      expect(reportDownloadUtils.exportReportToCSV).toHaveBeenCalledWith(
        weeklyData,
        'Weekly Report'
      );
    });
  });

  describe('PNG Export Functionality', () => {
    it('calls exportChartToPNG when PNG button is clicked', async () => {
      (reportDownloadUtils.exportChartToPNG as jest.Mock).mockResolvedValue(
        undefined
      );

      render(<ReportChart {...defaultProps} />);
      const pngButton = screen.getByTitle('Download as PNG');

      fireEvent.click(pngButton);

      await waitFor(() => {
        expect(reportDownloadUtils.exportChartToPNG).toHaveBeenCalledWith(
          'daily-report-chart',
          'Daily Report'
        );
      });
    });

    it('shows loading state during PNG export', async () => {
      (reportDownloadUtils.exportChartToPNG as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ReportChart {...defaultProps} />);
      const pngButton = screen.getByTitle('Download as PNG');

      fireEvent.click(pngButton);

      // Check for loader icon
      await waitFor(() => {
        expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      });
    });

    it('disables PNG button during export', async () => {
      (reportDownloadUtils.exportChartToPNG as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ReportChart {...defaultProps} />);
      const pngButton = screen.getByTitle('Download as PNG');

      fireEvent.click(pngButton);

      await waitFor(() => {
        expect(pngButton).toBeDisabled();
      });
    });

    it('re-enables PNG button after successful export', async () => {
      (reportDownloadUtils.exportChartToPNG as jest.Mock).mockResolvedValue(
        undefined
      );

      render(<ReportChart {...defaultProps} />);
      const pngButton = screen.getByTitle('Download as PNG');

      fireEvent.click(pngButton);

      await waitFor(() => {
        expect(pngButton).not.toBeDisabled();
      });
    });

    it('button loading state toggles correctly during export', async () => {
      // Mock a slow export operation
      (reportDownloadUtils.exportChartToPNG as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ReportChart {...defaultProps} />);
      const pngButton = screen.getByTitle('Download as PNG');

      // Button should be enabled initially
      expect(pngButton).not.toBeDisabled();

      // Click to trigger export
      fireEvent.click(pngButton);

      // Button should be disabled during export
      await waitFor(() => {
        expect(pngButton).toBeDisabled();
      });

      // Button should be re-enabled after export completes
      await waitFor(
        () => {
          expect(pngButton).not.toBeDisabled();
        },
        { timeout: 1000 }
      );
    });

    it('calls exportChartToPNG with correct chartId for different charts', async () => {
      (reportDownloadUtils.exportChartToPNG as jest.Mock).mockResolvedValue(
        undefined
      );

      render(
        <ReportChart
          data={mockData}
          title="Monthly Report"
          chartId="monthly-report-chart"
        />
      );

      const pngButton = screen.getByTitle('Download as PNG');
      fireEvent.click(pngButton);

      await waitFor(() => {
        expect(reportDownloadUtils.exportChartToPNG).toHaveBeenCalledWith(
          'monthly-report-chart',
          'Monthly Report'
        );
      });
    });

    it('handles multiple rapid PNG export clicks gracefully', async () => {
      (reportDownloadUtils.exportChartToPNG as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ReportChart {...defaultProps} />);
      const pngButton = screen.getByTitle('Download as PNG');

      // Click multiple times rapidly
      fireEvent.click(pngButton);
      fireEvent.click(pngButton);
      fireEvent.click(pngButton);

      // Should only be called once since button is disabled during export
      await waitFor(() => {
        expect(reportDownloadUtils.exportChartToPNG).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Chart Styling and Structure', () => {
    it('applies correct CSS classes to chart container', () => {
      const { container } = render(<ReportChart {...defaultProps} />);
      const chartContainer = container.querySelector('#daily-report-chart');

      expect(chartContainer).toHaveClass('flex-1');
      expect(chartContainer).toHaveClass('min-w-[300px]');
      expect(chartContainer).toHaveClass('p-4');
      expect(chartContainer).toHaveClass('bg-[#1c1c1c]');
      expect(chartContainer).toHaveClass('rounded-lg');
      expect(chartContainer).toHaveClass('h-[350px]');
      expect(chartContainer).toHaveClass('relative');
    });

    it('has correct button styling', () => {
      render(<ReportChart {...defaultProps} />);
      const csvButton = screen.getByTitle('Download as CSV');

      expect(csvButton).toHaveClass('h-8');
      expect(csvButton).toHaveClass('w-8');
    });
  });

  describe('Edge Cases', () => {
    it('handles data with zero values', () => {
      const zeroData = [{ name: 'Today', completed: 0, ongoing: 0 }];
      render(<ReportChart {...defaultProps} data={zeroData} />);

      expect(screen.getByText('Daily Report')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('handles large data values', () => {
      const largeData = [{ name: 'Today', completed: 9999, ongoing: 8888 }];
      render(<ReportChart {...defaultProps} data={largeData} />);

      expect(screen.getByText('Daily Report')).toBeInTheDocument();
    });

    it('handles special characters in title', () => {
      render(
        <ReportChart {...defaultProps} title="Report: Daily & Weekly (2023)" />
      );

      expect(
        screen.getByText('Report: Daily & Weekly (2023)')
      ).toBeInTheDocument();
    });

    it('handles special characters in chartId', () => {
      const { container } = render(
        <ReportChart {...defaultProps} chartId="report-chart-2023-11-18" />
      );

      expect(
        container.querySelector('#report-chart-2023-11-18')
      ).toBeInTheDocument();
    });
  });
});
