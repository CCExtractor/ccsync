import { render, screen } from '@testing-library/react';
import BottomBar from '../BottomBar';

describe('BottomBar Component', () => {
  const mockSetSelectedProject = jest.fn();
  const mockSetSelectedStatus = jest.fn();
  const mockSetSelectedTag = jest.fn();
  const projects = ['Project A', 'Project B'];
  const status = ['Status A', 'Status B'];
  const tags = ['bug', 'feature'];

  test('renders BottomBar component', () => {
    render(
      <BottomBar
        projects={projects}
        setSelectedProject={mockSetSelectedProject}
        status={status}
        setSelectedStatus={mockSetSelectedStatus}
        tags={tags}
        setSelectedTag={mockSetSelectedTag}
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
