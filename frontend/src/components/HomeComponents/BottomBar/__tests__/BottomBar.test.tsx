import { render, screen } from '@testing-library/react';
import BottomBar from '../BottomBar';

describe('BottomBar Component', () => {
  const mockSetSelectedProject = jest.fn();
  const mockSetSelectedStatus = jest.fn();
  const projects = ['Project A', 'Project B'];
  const status = ['Status A', 'Status B'];

  test('renders BottomBar component', () => {
    render(
      <BottomBar
        projects={projects}
        selectedProject={null}
        setSelectedProject={mockSetSelectedProject}
        status={status}
        selectedStatus={null}
        setSelectedStatus={mockSetSelectedStatus}
      />
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });
});
