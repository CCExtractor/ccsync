import { render } from '@testing-library/react';
import { ReportsView } from '../ReportsView';

const mockToday = new Date('2025-11-11T10:00:00.000Z');

type TaskStatus = 'pending' | 'completed';
type DateOffset = 'dailyData' | 'weeklyData' | 'monthlyData';

const createMockTask = (
  overrides: Partial<{
    id: number;
    status: TaskStatus;
    dateOffset: DateOffset;
    tags: string[];
    depends: string[];
  }> = {}
) => {
  const {
    id = 1,
    status = 'pending',
    dateOffset = 'dailyData',
    tags = ['tag1', 'tag2'],
    depends = ['depends1', 'depends2'],
  } = overrides;

  const getDateForOffset = (offset: DateOffset): Date => {
    switch (offset) {
      case 'dailyData':
        return mockToday;
      case 'weeklyData':
        // Calcul du début de la semaine (dimanche)
        const startOfWeek = new Date(mockToday);
        startOfWeek.setUTCDate(
          startOfWeek.getUTCDate() - startOfWeek.getUTCDay()
        );
        return startOfWeek;
      case 'monthlyData':
        return new Date(mockToday.getUTCFullYear(), mockToday.getUTCMonth(), 1);
    }
  };

  return {
    id,
    description: 'mockDescription',
    project: 'mockProject',
    status,
    tags,
    uuid: `mockUuid-${id}`,
    urgency: 1,
    priority: 'mockPriority',
    due: 'mockDue',
    start: 'mockStart',
    end: 'mockEnd',
    entry: 'mockEntry',
    wait: 'mockWait',
    modified: getDateForOffset(dateOffset).toISOString(),
    depends,
    rtype: 'mockRtype',
    recur: 'mockRecur',
    annotations: [],
    email: 'mockEmail',
  };
};

// Builders pour des scénarios spécifiques
const createDailyTasks = () => [
  createMockTask({ id: 1, status: 'pending', dateOffset: 'dailyData' }),
  createMockTask({ id: 2, status: 'completed', dateOffset: 'dailyData' }),
];

const createWeeklyTasks = () => [
  ...createDailyTasks(),
  createMockTask({ id: 3, status: 'pending', dateOffset: 'weeklyData' }),
  createMockTask({ id: 4, status: 'completed', dateOffset: 'weeklyData' }),
  createMockTask({ id: 5, status: 'pending', dateOffset: 'monthlyData' }),
  createMockTask({ id: 6, status: 'completed', dateOffset: 'monthlyData' }),
];

const createMonthlyTasks = () => [
  ...createWeeklyTasks(),
  createMockTask({ id: 7, status: 'pending', dateOffset: 'monthlyData' }),
  createMockTask({ id: 8, status: 'completed', dateOffset: 'monthlyData' }),
];

const mockTasksWithOneTask = createDailyTasks().slice(0, 1);
const mockTasksWithSeveralTasks = createMonthlyTasks();

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children, width, height }: any) => (
    <div data-testid="ResponsiveContainer" style={{ width, height }}>
      {children}
    </div>
  ),
  BarChart: ({ data, margin, children }: any) => (
    <div data-testid="BarChart" style={margin}>
      {data.map((item: any, index: number) => (
        <div key={index}>
          {Object.entries(item).map(([key, value]) => (
            <span key={key}>
              {key}: {String(value)}{' '}
            </span>
          ))}
        </div>
      ))}
      {children}
    </div>
  ),
  CartesianGrid: ({ strokeDasharray, stroke }: any) => (
    <div
      data-testid="CartesianGrid"
      data-stroke-dasharray={strokeDasharray}
      data-stroke={stroke}
    />
  ),
  XAxis: ({ dataKey, stroke }: any) => (
    <div data-testid="XAxis" data-data-key={dataKey} data-stroke={stroke} />
  ),
  YAxis: ({ allowDecimals, stroke }: any) => (
    <div
      data-testid="YAxis"
      data-allow-decimals={allowDecimals}
      data-stroke={stroke}
    />
  ),
  Tooltip: ({ contentStyle, labelClassName }: any) => (
    <div
      data-testid="Tooltip"
      style={contentStyle}
      className={labelClassName}
    />
  ),
  Legend: ({ wrapperClassName }: any) => (
    <div data-testid="Legend" className={wrapperClassName} />
  ),
  Bar: ({ dataKey, fill, name }: any) => (
    <div
      data-testid="Bar"
      data-data-key={dataKey}
      data-fill={fill}
      data-name={name}
    />
  ),
}));

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(mockToday);
});
afterEach(() => {
  jest.useRealTimers();
});

describe('ReportsView Component using Snapshot', () => {
  test('renders correctly with only one task', () => {
    const { asFragment } = render(<ReportsView tasks={mockTasksWithOneTask} />);
    expect(asFragment()).toMatchSnapshot('one task');
  });
  test('renders correctly with only several tasks', () => {
    const { asFragment } = render(
      <ReportsView tasks={mockTasksWithSeveralTasks} />
    );
    expect(asFragment()).toMatchSnapshot('several tasks');
  });
});
