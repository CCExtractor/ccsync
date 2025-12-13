import { render, screen } from '@testing-library/react';
import { ReportsView } from '../ReportsView';
import { Task } from '@/components/utils/types';

jest.mock('../ReportChart', () => ({
  ReportChart: jest.fn(({ title, data, chartId }) => (
    <div data-testid={chartId}>
      <h3>{title}</h3>
      <div data-testid={`${chartId}-data`}>{JSON.stringify(data)}</div>
    </div>
  )),
}));

describe('ReportsView', () => {
  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: 1,
    description: 'Test task',
    project: 'Test',
    tags: [],
    status: 'pending',
    uuid: 'test-uuid',
    urgency: 0,
    priority: 'M',
    due: '',
    start: '',
    end: '',
    entry: '',
    wait: '',
    modified: '',
    depends: [],
    rtype: '',
    recur: '',
    annotations: [],
    email: 'test@example.com',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all three report charts', () => {
      const tasks = [createMockTask()];
      render(<ReportsView tasks={tasks} />);

      expect(screen.getByText('Daily Report')).toBeInTheDocument();
      expect(screen.getByText('Weekly Report')).toBeInTheDocument();
      expect(screen.getByText('Monthly Report')).toBeInTheDocument();
    });

    it('renders with empty tasks array', () => {
      render(<ReportsView tasks={[]} />);

      expect(screen.getByText('Daily Report')).toBeInTheDocument();
      expect(screen.getByText('Weekly Report')).toBeInTheDocument();
      expect(screen.getByText('Monthly Report')).toBeInTheDocument();
    });
  });

  describe('Data Calculation', () => {
    it('counts completed tasks correctly', () => {
      const today = new Date().toISOString();
      const tasks = [
        createMockTask({ status: 'completed', modified: today }),
        createMockTask({ status: 'completed', modified: today }),
        createMockTask({ status: 'pending', modified: today }),
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('daily-report-chart-data');
      const data = JSON.parse(dailyData.textContent || '[]');

      expect(data[0].completed).toBe(2);
      expect(data[0].ongoing).toBe(1);
    });

    it('counts pending tasks as ongoing', () => {
      const today = new Date().toISOString();
      const tasks = [
        createMockTask({ status: 'pending', modified: today }),
        createMockTask({ status: 'pending', modified: today }),
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('daily-report-chart-data');
      const data = JSON.parse(dailyData.textContent || '[]');

      expect(data[0].ongoing).toBe(2);
      expect(data[0].completed).toBe(0);
    });

    it('filters tasks by date range correctly', () => {
      const referenceDate = new Date('2024-01-10T12:00:00Z');

      const today = new Date(referenceDate);
      const yesterday = new Date(referenceDate);
      yesterday.setDate(yesterday.getDate() - 1);

      const thisWeek = new Date(referenceDate);
      thisWeek.setDate(thisWeek.getDate() - 2);

      const tasks = [
        createMockTask({ status: 'completed', modified: today.toISOString() }),
        createMockTask({
          status: 'completed',
          modified: yesterday.toISOString(),
        }),
        createMockTask({
          status: 'completed',
          modified: thisWeek.toISOString(),
        }),
      ];

      jest.useFakeTimers();
      jest.setSystemTime(referenceDate);

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('daily-report-chart-data');
      const weeklyData = screen.getByTestId('weekly-report-chart-data');

      const daily = JSON.parse(dailyData.textContent || '[]');
      const weekly = JSON.parse(weeklyData.textContent || '[]');

      expect(daily[0].completed).toBe(1);
      expect(weekly[0].completed).toBeGreaterThanOrEqual(2);

      jest.useRealTimers();
    });

    it('uses modified date when available', () => {
      const today = new Date().toISOString();
      const tasks = [
        createMockTask({
          status: 'completed',
          modified: today,
          due: '2020-01-01T00:00:00Z',
        }),
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('daily-report-chart-data');
      const data = JSON.parse(dailyData.textContent || '[]');

      expect(data[0].completed).toBe(1);
    });

    it('falls back to due date when modified is not available', () => {
      const today = new Date().toISOString();
      const tasks = [
        createMockTask({
          status: 'completed',
          modified: '',
          due: today,
        }),
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('daily-report-chart-data');
      const data = JSON.parse(dailyData.textContent || '[]');

      expect(data[0].completed).toBe(1);
    });

    it('excludes tasks without modified or due dates', () => {
      const tasks = [
        createMockTask({
          status: 'completed',
          modified: '',
          due: '',
        }),
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('daily-report-chart-data');
      const data = JSON.parse(dailyData.textContent || '[]');

      expect(data[0].completed).toBe(0);
      expect(data[0].ongoing).toBe(0);
    });

    it('handles mixed statuses correctly', () => {
      const today = new Date().toISOString();
      const tasks = [
        createMockTask({ status: 'completed', modified: today }),
        createMockTask({ status: 'pending', modified: today }),
        createMockTask({ status: 'deleted', modified: today }),
        createMockTask({ status: 'recurring', modified: today }),
      ];

      render(<ReportsView tasks={tasks} />);

      const dailyData = screen.getByTestId('daily-report-chart-data');
      const data = JSON.parse(dailyData.textContent || '[]');

      expect(data[0].completed).toBe(1);
      expect(data[0].ongoing).toBe(1);
    });
  });

  describe('Time Ranges', () => {
    it('correctly identifies weekly date range', () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      const taskInWeek = new Date(startOfWeek);
      taskInWeek.setDate(taskInWeek.getDate() + 1);

      const tasks = [
        createMockTask({
          status: 'completed',
          modified: taskInWeek.toISOString(),
        }),
      ];

      render(<ReportsView tasks={tasks} />);

      const weeklyData = screen.getByTestId('weekly-report-chart-data');
      const data = JSON.parse(weeklyData.textContent || '[]');

      expect(data[0].completed).toBeGreaterThanOrEqual(1);
    });

    it('correctly identifies monthly date range', () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const taskInMonth = new Date(startOfMonth);
      taskInMonth.setDate(taskInMonth.getDate() + 5);

      const tasks = [
        createMockTask({
          status: 'completed',
          modified: taskInMonth.toISOString(),
        }),
      ];

      render(<ReportsView tasks={tasks} />);

      const monthlyData = screen.getByTestId('monthly-report-chart-data');
      const data = JSON.parse(monthlyData.textContent || '[]');

      expect(data[0].completed).toBe(1);
    });
  });
});
