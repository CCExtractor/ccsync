import { render, screen } from '@testing-library/react';
import BottomBar from '../BottomBar';

describe('BottomBar Component', () => {
  const mockOnOpenFilterSheet = jest.fn();

  test('renders BottomBar component with filter button', () => {
    render(
      <BottomBar
        onOpenFilterSheet={mockOnOpenFilterSheet}
        activeFilterCount={0}
      />
    );

    const homeLink = screen.getByRole('link', { name: /home/i });
    const tasksLink = screen.getByRole('link', { name: /tasks/i });
    expect(homeLink).toHaveAttribute('href', '#');
    expect(tasksLink).toHaveAttribute('href', '#tasks');

    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
  });

  test('displays an active filter count badge when count > 0', () => {
    render(
      <BottomBar
        onOpenFilterSheet={mockOnOpenFilterSheet}
        activeFilterCount={3}
      />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
