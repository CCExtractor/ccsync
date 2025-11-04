import { render, screen } from '@testing-library/react';
import BottomBar from '../BottomBar';

describe('BottomBar Component', () => {
  const mockOnProjectSelect = jest.fn();
  const mockOnStatusSelect = jest.fn();
  const mockOnTagSelect = jest.fn();
  const projects = ['Project A', 'Project B'];
  const status = ['pending', 'completed'];
  const tags = ['bug', 'feature'];

  test('renders BottomBar component', () => {
    render(
      <BottomBar
        projects={projects}
        onProjectSelect={mockOnProjectSelect}
        status={status}
        onStatusSelect={mockOnStatusSelect}
        tags={tags}
        onTagSelect={mockOnTagSelect}
      />
    );

    const homeLink = screen.getByRole('link', { name: /home/i });
    const tasksLink = screen.getByRole('link', { name: /tasks/i });
    expect(homeLink).toHaveAttribute('href', '#');
    expect(tasksLink).toHaveAttribute('href', '#tasks');

    expect(
      screen.getByRole('combobox', { name: /filter/i })
    ).toBeInTheDocument();
  });
});
