import { render } from '@testing-library/react';
import { ReportsView } from '../ReportsView';

const mockToday = new Date('2025-01-05T10:00:00.000Z');

const mockBasicTaskToday = {
  id: 2,
  description: 'mockDescription',
  project: 'mockProject',
  status: 'pending',
  tags: [''],
  uuid: 'mockUuid',
  urgency: 1,
  priority: 'mockPriority',
  due: 'mockDue',
  start: 'mockStart',
  end: 'mockEnd',
  entry: 'mockEntry',
  wait: 'mockWait',
  modified: mockToday.toISOString(),
  depends: [''],
  rtype: 'mockRtype',
  recur: 'mockRecur',
  email: 'mockEmail',
};
const mockBasicTaskTodayCompleted = {
  ...mockBasicTaskToday,
  status: 'completed',
};
const mockBasicTaskTomorrow = {
  ...mockBasicTaskToday,
  modified: new Date(
    mockToday.getUTCFullYear(),
    mockToday.getUTCMonth(),
    mockToday.getUTCDate() + 1
  ).toISOString(),
};
const mockBasicTaskTomorrowCompleted = {
  ...mockBasicTaskTomorrow,
  status: 'completed',
};
const mockBasicTaskNextWeek = {
  ...mockBasicTaskToday,
  modified: new Date(
    mockToday.getUTCFullYear(),
    mockToday.getUTCMonth(),
    mockToday.getUTCDate() + 7
  ).toISOString(),
};
const mockBasicTaskNextWeekCompleted = {
  ...mockBasicTaskNextWeek,
  status: 'completed',
};

const mockTaskWithTagsAndDependsToday = {
  ...mockBasicTaskToday,
  tags: ['tag1', 'tag2', 'tag3'],
  depends: ['depend1', 'depend2', 'depend3'],
};
const mockTaskWithTagsAndDependsTodayCompleted = {
  ...mockTaskWithTagsAndDependsToday,
  status: 'completed',
};

const mockTaskWithTagsAndDependsTomorrow = {
  ...mockTaskWithTagsAndDependsToday,
  modified: new Date(
    mockToday.getUTCFullYear(),
    mockToday.getUTCMonth(),
    mockToday.getUTCDate() + 1
  ).toISOString(),
};
const mockTaskWithTagsAndDependsTomorrowCompleted = {
  ...mockTaskWithTagsAndDependsTomorrow,
  status: 'completed',
};
const mockTaskWithTagsAndDependsWeek = {
  ...mockTaskWithTagsAndDependsToday,
  modified: new Date(
    mockToday.getUTCFullYear(),
    mockToday.getUTCMonth(),
    mockToday.getUTCDate() + 7
  ).toISOString(),
};
const mockTaskWithTagsAndDependsWeekCompleted = {
  ...mockTaskWithTagsAndDependsWeek,
  status: 'completed',
};

const mockTasksWithOneTask = [mockBasicTaskToday];
const mockTasksWithSeveralTasks = [
  mockBasicTaskToday,
  mockBasicTaskTodayCompleted,
  mockBasicTaskTomorrow,
  mockBasicTaskTomorrowCompleted,
  mockBasicTaskNextWeek,
  mockBasicTaskNextWeekCompleted,
  mockTaskWithTagsAndDependsToday,
  mockTaskWithTagsAndDependsTodayCompleted,
  mockTaskWithTagsAndDependsTomorrow,
  mockTaskWithTagsAndDependsTomorrowCompleted,
  mockTaskWithTagsAndDependsWeek,
  mockTaskWithTagsAndDependsWeekCompleted,
];

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
