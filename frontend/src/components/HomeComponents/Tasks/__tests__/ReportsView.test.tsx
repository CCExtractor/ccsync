import { render, screen } from '@testing-library/react';
import { ReportsView } from '../ReportsView';
import { Task } from '@/components/utils/types';

// Mock ReportChart component
jest.mock('../ReportChart', () => ({
  ReportChart: jest.fn(({ data, title, chartId }) => (
    <div data-testid={`report-chart-${chartId}`}>
      <h3>{title}</h3>
      <div data-testid={`chart-data-${chartId}`}>{JSON.stringify(data)}</div>
    </div>
  )),
}));

// Use the real implementation
jest.mock('@/components/utils/utils', () => {
  const actual = jest.requireActual('@/components/utils/utils');
  return {
    ...actual,
    getStartOfDay: (date: Date) => {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      return newDate;
    },
  };
});

describe('ReportsView', () => {
  // Helper function to create mock tasks
  const createTask = (
    id: number,
    status: string,
    modified?: string,
    due?: string
  ): Task => ({
    id,
    status,
    modified: modified || '',
    due: due || '',
    description: `Task ${id}`,
    project: '',
    tags: [],
    uuid: `uuid-${id}`,
    urgency: 0,
    priority: '',
    end: '',
    entry: '',
    email: '',
    start: '',
    wait: '',
    depends: [],
    rtype: '',
    recur: '',
  });

  beforeEach(() => {
    // Mock the current date to a fixed date for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-11-18T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders all three report charts', () => {
      const tasks: Task[] = [];
      render(<ReportsView tasks={tasks} />);

      expect(screen.getByText('Daily Report')).toBeInTheDocument();
      expect(screen.getByText('Weekly Report')).toBeInTheDocument();
      expect(screen.getByText('Monthly Report')).toBeInTheDocument();
    });

    it('renders with correct chart IDs', () => {
      const tasks: Task[] = [];
      render(<ReportsView tasks={tasks} />);

      expect(
        screen.getByTestId('report-chart-daily-report-chart')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('report-chart-weekly-report-chart')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('report-chart-monthly-report-chart')
      ).toBeInTheDocument();
    });

    it('applies correct CSS classes to container', () => {
      const tasks: Task[] = [];
      const { container } = render(<ReportsView tasks={tasks} />);

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('flex');
      expect(mainDiv).toHaveClass('flex-wrap');
      expect(mainDiv).toHaveClass('gap-4');
      expect(mainDiv).toHaveClass('justify-center');
      expect(mainDiv).toHaveClass('mt-10');
    });
  });

  describe('Data Calculation - Daily Report', () => {
    it('counts completed and ongoing tasks for today', () => {
      const today = '2023-11-18T12:00:00.000Z';
      const tasks: Task[] = [
        createTask(1, 'completed', today),
        createTask(2, 'completed', today),
        createTask(3, 'pending', today),
        createTask(4, 'pending', today),
        createTask(5, 'pending', today),
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('chart-data-daily-report-chart');
      const data = JSON.parse(dailyData.textContent || '[]');

      expect(data[0]).toEqual({
        name: 'Today',
        completed: 2,
        ongoing: 3,
      });
    });

    it('excludes tasks from yesterday', () => {
      const yesterday = '2023-11-17T12:00:00.000Z';
      const tasks: Task[] = [
        createTask(1, 'completed', yesterday),
        createTask(2, 'pending', yesterday),
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('chart-data-daily-report-chart');
      const data = JSON.parse(dailyData.textContent || '[]');

      expect(data[0]).toEqual({
        name: 'Today',
        completed: 0,
        ongoing: 0,
      });
    });

    it('uses due date when modified date is not available', () => {
      const today = '2023-11-18T12:00:00.000Z';
      const tasks: Task[] = [
        createTask(1, 'completed', '', today),
        createTask(2, 'pending', '', today),
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('chart-data-daily-report-chart');
      const data = JSON.parse(dailyData.textContent || '[]');

      expect(data[0].completed).toBe(1);
      expect(data[0].ongoing).toBe(1);
    });

    it('excludes tasks without modified or due dates', () => {
      const today = '2023-11-18T12:00:00.000Z';
      const tasks: Task[] = [
        createTask(1, 'completed', today),
        createTask(2, 'completed', '', ''), // No dates
        createTask(3, 'pending', today),
        createTask(4, 'pending', '', ''), // No dates
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('chart-data-daily-report-chart');
      const data = JSON.parse(dailyData.textContent || '[]');

      expect(data[0]).toEqual({
        name: 'Today',
        completed: 1,
        ongoing: 1,
      });
    });

    it('ignores deleted tasks', () => {
      const today = '2023-11-18T12:00:00.000Z';
      const tasks: Task[] = [
        createTask(1, 'completed', today),
        createTask(2, 'pending', today),
        createTask(3, 'deleted', today),
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('chart-data-daily-report-chart');
      const data = JSON.parse(dailyData.textContent || '[]');

      expect(data[0]).toEqual({
        name: 'Today',
        completed: 1,
        ongoing: 1,
      });
    });
  });

  describe('Data Calculation - Weekly Report', () => {
    it('counts tasks from the beginning of the week', () => {
      // Sunday (start of week in this implementation)
      const sunday = '2023-11-12T12:00:00.000Z';
      const monday = '2023-11-13T12:00:00.000Z';
      const today = '2023-11-18T12:00:00.000Z'; // Saturday

      const tasks: Task[] = [
        createTask(1, 'completed', sunday),
        createTask(2, 'completed', monday),
        createTask(3, 'completed', today),
        createTask(4, 'pending', sunday),
        createTask(5, 'pending', today),
      ];

      render(<ReportsView tasks={tasks} />);

      const weeklyData = screen.getByTestId('chart-data-weekly-report-chart');
      const data = JSON.parse(weeklyData.textContent || '[]');

      expect(data[0].name).toBe('This Week');
      expect(data[0].completed).toBe(3);
      expect(data[0].ongoing).toBe(2);
    });

    it('excludes tasks from last week', () => {
      const lastWeek = '2023-11-11T12:00:00.000Z';
      const tasks: Task[] = [
        createTask(1, 'completed', lastWeek),
        createTask(2, 'pending', lastWeek),
      ];

      render(<ReportsView tasks={tasks} />);

      const weeklyData = screen.getByTestId('chart-data-weekly-report-chart');
      const data = JSON.parse(weeklyData.textContent || '[]');

      expect(data[0]).toEqual({
        name: 'This Week',
        completed: 0,
        ongoing: 0,
      });
    });
  });

  describe('Data Calculation - Monthly Report', () => {
    it('counts tasks from the beginning of the month', () => {
      const startOfMonth = '2023-11-01T12:00:00.000Z';
      const midMonth = '2023-11-15T12:00:00.000Z';
      const today = '2023-11-18T12:00:00.000Z';

      const tasks: Task[] = [
        createTask(1, 'completed', startOfMonth),
        createTask(2, 'completed', midMonth),
        createTask(3, 'completed', today),
        createTask(4, 'pending', startOfMonth),
        createTask(5, 'pending', midMonth),
        createTask(6, 'pending', today),
      ];

      render(<ReportsView tasks={tasks} />);

      const monthlyData = screen.getByTestId('chart-data-monthly-report-chart');
      const data = JSON.parse(monthlyData.textContent || '[]');

      expect(data[0].name).toBe('This Month');
      expect(data[0].completed).toBe(3);
      expect(data[0].ongoing).toBe(3);
    });

    it('excludes tasks from last month', () => {
      const lastMonth = '2023-10-31T12:00:00.000Z';
      const tasks: Task[] = [
        createTask(1, 'completed', lastMonth),
        createTask(2, 'pending', lastMonth),
      ];

      render(<ReportsView tasks={tasks} />);

      const monthlyData = screen.getByTestId('chart-data-monthly-report-chart');
      const data = JSON.parse(monthlyData.textContent || '[]');

      expect(data[0]).toEqual({
        name: 'This Month',
        completed: 0,
        ongoing: 0,
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty tasks array', () => {
      const tasks: Task[] = [];
      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('chart-data-daily-report-chart');
      const data = JSON.parse(dailyData.textContent || '[]');

      expect(data[0]).toEqual({
        name: 'Today',
        completed: 0,
        ongoing: 0,
      });
    });

    it('handles tasks with invalid date formats', () => {
      const today = '2023-11-18T12:00:00.000Z';
      const tasks: Task[] = [
        createTask(1, 'completed', 'invalid-date'),
        createTask(2, 'pending', today),
        createTask(3, 'completed', 'not-a-date'),
      ];

      render(<ReportsView tasks={tasks} />);

      // Should still render without crashing
      expect(screen.getByText('Daily Report')).toBeInTheDocument();
    });

    it('handles very large task counts', () => {
      const today = '2023-11-18T12:00:00.000Z';
      const tasks: Task[] = [
        ...Array.from({ length: 500 }, (_, i) =>
          createTask(i, 'completed', today)
        ),
        ...Array.from({ length: 300 }, (_, i) =>
          createTask(i + 500, 'pending', today)
        ),
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('chart-data-daily-report-chart');
      const data = JSON.parse(dailyData.textContent || '[]');

      expect(data[0].completed).toBe(500);
      expect(data[0].ongoing).toBe(300);
    });

    it('handles tasks with timestamps at different times of day', () => {
      const morningToday = '2023-11-18T06:30:00.000Z';
      const noonToday = '2023-11-18T12:00:00.000Z';
      const eveningToday = '2023-11-18T20:45:00.000Z';

      const tasks: Task[] = [
        createTask(1, 'completed', morningToday),
        createTask(2, 'completed', noonToday),
        createTask(3, 'pending', eveningToday),
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('chart-data-daily-report-chart');
      const data = JSON.parse(dailyData.textContent || '[]');

      expect(data[0].completed).toBe(2);
      expect(data[0].ongoing).toBe(1);
    });

    it('prioritizes modified date over due date when both exist', () => {
      const today = '2023-11-18T12:00:00.000Z';
      const yesterday = '2023-11-17T12:00:00.000Z';

      const tasks: Task[] = [
        createTask(1, 'completed', today, yesterday), // modified is today, due is yesterday
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('chart-data-daily-report-chart');
      const data = JSON.parse(dailyData.textContent || '[]');

      // Should count it for today (using modified date)
      expect(data[0].completed).toBe(1);
    });
  });

  describe('Data Consistency Across Reports', () => {
    it('includes daily tasks in weekly report', () => {
      const today = '2023-11-18T12:00:00.000Z';
      const tasks: Task[] = [
        createTask(1, 'completed', today),
        createTask(2, 'pending', today),
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('chart-data-daily-report-chart');
      const weeklyData = screen.getByTestId('chart-data-weekly-report-chart');

      const daily = JSON.parse(dailyData.textContent || '[]');
      const weekly = JSON.parse(weeklyData.textContent || '[]');

      // Today's tasks should be in both reports
      expect(daily[0].completed).toBe(1);
      expect(weekly[0].completed).toBeGreaterThanOrEqual(1);
    });

    it('includes weekly tasks in monthly report', () => {
      const today = '2023-11-18T12:00:00.000Z';
      const tasks: Task[] = [
        createTask(1, 'completed', today),
        createTask(2, 'pending', today),
      ];

      render(<ReportsView tasks={tasks} />);

      const weeklyData = screen.getByTestId('chart-data-weekly-report-chart');
      const monthlyData = screen.getByTestId('chart-data-monthly-report-chart');

      const weekly = JSON.parse(weeklyData.textContent || '[]');
      const monthly = JSON.parse(monthlyData.textContent || '[]');

      // This week's tasks should be in both reports
      expect(weekly[0].completed).toBe(1);
      expect(monthly[0].completed).toBeGreaterThanOrEqual(1);
    });
  });
});
