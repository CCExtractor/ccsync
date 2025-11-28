import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportChart } from '../ReportChart';
import * as downloadUtils from '../report-download-utils';

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, fill, name }: any) => (
    <div data-testid={`bar-${dataKey}`} data-fill={fill} data-name={name} />
  ),
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

jest.mock('../report-download-utils', () => ({
  exportReportToCSV: jest.fn(),
  exportChartToPNG: jest.fn().mockResolvedValue(undefined),
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
    it('renders chart with title', () => {
      render(<ReportChart {...defaultProps} />);
      expect(screen.getByText('Daily Report')).toBeInTheDocument();
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

    it('renders bar chart with data', () => {
      render(<ReportChart {...defaultProps} />);
      const barChart = screen.getByTestId('bar-chart');
      expect(barChart).toBeInTheDocument();
      expect(barChart.getAttribute('data-chart-data')).toBe(
        JSON.stringify(mockData)
      );
    });

    it('renders responsive container', () => {
      render(<ReportChart {...defaultProps} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Chart Elements', () => {
    it('displays completed bar with correct color', () => {
      render(<ReportChart {...defaultProps} />);
      const completedBar = screen.getByTestId('bar-completed');
      expect(completedBar).toHaveAttribute('data-fill', '#E776CB');
      expect(completedBar).toHaveAttribute('data-name', 'Completed');
    });

    it('displays ongoing bar with correct color', () => {
      render(<ReportChart {...defaultProps} />);
      const ongoingBar = screen.getByTestId('bar-ongoing');
      expect(ongoingBar).toHaveAttribute('data-fill', '#5FD9FA');
      expect(ongoingBar).toHaveAttribute('data-name', 'Ongoing');
    });

    it('renders chart axes', () => {
      render(<ReportChart {...defaultProps} />);
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });

    it('renders legend', () => {
      render(<ReportChart {...defaultProps} />);
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('renders tooltip', () => {
      render(<ReportChart {...defaultProps} />);
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('renders cartesian grid', () => {
      render(<ReportChart {...defaultProps} />);
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });
  });

  describe('CSV Export', () => {
    it('triggers CSV export when button clicked', () => {
      render(<ReportChart {...defaultProps} />);
      const csvButton = screen.getByTitle('Download as CSV');

      fireEvent.click(csvButton);

      expect(downloadUtils.exportReportToCSV).toHaveBeenCalledWith(
        mockData,
        'Daily Report'
      );
    });

    it('does not disable CSV button during PNG export', async () => {
      (downloadUtils.exportChartToPNG as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ReportChart {...defaultProps} />);
      const pngButton = screen.getByTitle('Download as PNG');
      const csvButton = screen.getByTitle('Download as CSV');

      fireEvent.click(pngButton);

      expect(csvButton).toBeDisabled();
    });
  });

  describe('PNG Export', () => {
    it('triggers PNG export when button clicked', async () => {
      render(<ReportChart {...defaultProps} />);
      const pngButton = screen.getByTitle('Download as PNG');

      fireEvent.click(pngButton);

      await waitFor(() => {
        expect(downloadUtils.exportChartToPNG).toHaveBeenCalledWith(
          'daily-report-chart',
          'Daily Report'
        );
      });
    });

    it('shows loading spinner during export', async () => {
      (downloadUtils.exportChartToPNG as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ReportChart {...defaultProps} />);
      const pngButton = screen.getByTitle('Download as PNG');

      fireEvent.click(pngButton);

      expect(pngButton).toBeDisabled();

      await waitFor(() => {
        expect(downloadUtils.exportChartToPNG).toHaveBeenCalled();
      });
    });

    it('re-enables button after export completes', async () => {
      render(<ReportChart {...defaultProps} />);
      const pngButton = screen.getByTitle('Download as PNG');

      fireEvent.click(pngButton);

      await waitFor(() => {
        expect(pngButton).not.toBeDisabled();
      });
    });
  });

  describe('Multiple Data Points', () => {
    it('handles multiple data entries', () => {
      const multiData = [
        { name: 'Week 1', completed: 10, ongoing: 5 },
        { name: 'Week 2', completed: 8, ongoing: 7 },
        { name: 'Week 3', completed: 12, ongoing: 3 },
      ];

      render(<ReportChart {...defaultProps} data={multiData} />);

      const barChart = screen.getByTestId('bar-chart');
      expect(barChart.getAttribute('data-chart-data')).toBe(
        JSON.stringify(multiData)
      );
    });

    it('handles zero values', () => {
      const zeroData = [{ name: 'Today', completed: 0, ongoing: 0 }];

      render(<ReportChart {...defaultProps} data={zeroData} />);

      const barChart = screen.getByTestId('bar-chart');
      expect(barChart).toBeInTheDocument();
    });
  });
});

describe('ReportChart Component using Snapshot', () => {
  const mockReportDataOne = {
    name: 'Project A',
    completed: 5,
    ongoing: 3,
  };

  const mockReportDataTwo = {
    name: 'Project B',
    completed: 10,
    ongoing: 7,
  };

  const mockReportDataThree = {
    name: 'Project C',
    completed: 2,
    ongoing: 1,
  };

  const mockDataWithOneEntry = [mockReportDataOne];
  const mockDataWithSeveralEntries = [
    mockReportDataOne,
    mockReportDataTwo,
    mockReportDataThree,
  ];
  test('renders correctly with one data entry', () => {
    const { asFragment } = render(
      <ReportChart
        data={mockDataWithOneEntry}
        title="One project"
        chartId="chart-1"
      />
    );
    expect(asFragment()).toMatchSnapshot('one data entry');
  });

  test('renders correctly with several data entries', () => {
    const { asFragment } = render(
      <ReportChart
        data={mockDataWithSeveralEntries}
        title="Multiple projects"
        chartId="chart-2"
      />
    );
    expect(asFragment()).toMatchSnapshot('several data entries');
  });
});
