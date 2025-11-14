import { render } from '@testing-library/react';
import { ReportChart } from '../ReportChart';

const mockEmptyTask = {
  id: 2,
  description: 'mockDescription',
  project: 'mockProject',
  tags: [''],
  status: 'mockStatus',
  uuid: 'mockUuid',
  urgency: 1,
  priority: 'mockPriority',
  due: 'mockDue',
  start: 'mockStart',
  end: 'mockEnd',
  entry: 'mockEntry',
  wait: 'mockWait',
  modified: 'mockModified',
  depends: [''],
  rtype: 'mockRtype',
  recur: 'mockRecur',
  email: 'mockEmail',
};

const mockFullTask = {
  ...mockEmptyTask,
  tags: ['tag1', 'tag2', 'tag3'],
  depends: ['depend1', 'depend2', 'depend3'],
};

const mockTasksWithOneTask = [mockEmptyTask];
const mockTasksWithSeveralTasks = [mockEmptyTask, mockFullTask, mockFullTask];

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children, width, height }: any) => (
    <div data-testid="ResponsiveContainer" style={{ width, height }}>
      {children}
    </div>
  ),
  BarChart: ({ data, margin, children }: any) => (
    <div data-testid="BarChart" style={margin} data-data={data}>
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

describe('ReportsView Component using Snapshot', () => {
  test('renders correctly with only one task', () => {
    const { asFragment } = render(
      <ReportChart data={mockTasksWithOneTask} title="One task" />
    );
    expect(asFragment()).toMatchSnapshot('one task');
  });
  test('renders correctly with only several tasks', () => {
    const { asFragment } = render(
      <ReportChart data={mockTasksWithSeveralTasks} title="Several tasks" />
    );
    expect(asFragment()).toMatchSnapshot('several tasks');
  });
});
