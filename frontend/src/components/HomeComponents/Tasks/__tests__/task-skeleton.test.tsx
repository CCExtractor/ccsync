import { render } from '@testing-library/react';
import { Taskskeleton } from '../TaskSkeleton';

// Mock des composants UI
jest.mock('@/components/ui/table', () => ({
  TableRow: jest.fn(({ children, ...props }) => <tr {...props}>{children}</tr>),
  TableCell: jest.fn(({ children, ...props }) => (
    <td {...props}>{children}</td>
  )),
}));

describe('TaskSkeleton Component using Snapshot', () => {
  test('renders correctly with count of 0', () => {
    const { asFragment } = render(
      <table>
        <tbody>
          <Taskskeleton count={0} />
        </tbody>
      </table>
    );
    expect(asFragment()).toMatchSnapshot('count 0');
  });

  test('renders correctly with count of 1', () => {
    const { asFragment } = render(
      <table>
        <tbody>
          <Taskskeleton count={1} />
        </tbody>
      </table>
    );
    expect(asFragment()).toMatchSnapshot('count 1');
  });

  test('renders correctly with count of 10', () => {
    const { asFragment } = render(
      <table>
        <tbody>
          <Taskskeleton count={10} />
        </tbody>
      </table>
    );
    expect(asFragment()).toMatchSnapshot('count 10');
  });
});
