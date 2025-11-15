import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BottomBar from '../BottomBar';
import { BottomBarProps } from '../bottom-bar-utils';

// Mock the MultiSelectFilter component
jest.mock('@/components/ui/multiSelect', () => ({
  MultiSelectFilter: jest.fn(({ title, selectedValues }) => (
    <div data-testid={`multiselect-${title.toLowerCase()}`}>
      <span data-testid={`multiselect-title-${title.toLowerCase()}`}>
        {title}
      </span>
      <span data-testid={`multiselect-count-${title.toLowerCase()}`}>
        {selectedValues.length}
      </span>
    </div>
  )),
}));

const mockProps: BottomBarProps = {
  projects: ['Project A', 'Project B'],
  selectedProjects: ['Project A'],
  setSelectedProject: jest.fn(),
  status: ['pending', 'completed', 'deleted'],
  selectedStatuses: ['pending', 'completed'],
  setSelectedStatus: jest.fn(),
  tags: ['tag1', 'tag2', 'tag3'],
  selectedTags: ['tag1'],
  setSelectedTag: jest.fn(),
};

describe('BottomBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders BottomBar component with navigation links and the main Filter button', () => {
    render(<BottomBar {...mockProps} />);

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute(
      'href',
      '#'
    );
    expect(screen.getByRole('link', { name: /tasks/i })).toHaveAttribute(
      'href',
      '#tasks'
    );
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
  });

  test('opens the Popover and renders the three MultiSelectFilters correctly', async () => {
    render(<BottomBar {...mockProps} />);
    const user = userEvent.setup();
    const filterButton = screen.getByRole('button', { name: /filter/i });

    // Click the filter button to open the Popover
    await user.click(filterButton);

    // Check Projects Filter
    expect(screen.getByTestId('multiselect-projects')).toBeInTheDocument();
    expect(screen.getByTestId('multiselect-title-projects')).toHaveTextContent(
      'Projects'
    );
    expect(screen.getByTestId('multiselect-count-projects')).toHaveTextContent(
      '1'
    );

    // Check Status Filter
    expect(screen.getByTestId('multiselect-status')).toBeInTheDocument();
    expect(screen.getByTestId('multiselect-title-status')).toHaveTextContent(
      'Status'
    );
    expect(screen.getByTestId('multiselect-count-status')).toHaveTextContent(
      '2'
    );

    // Check Tags Filter
    expect(screen.getByTestId('multiselect-tags')).toBeInTheDocument();
    expect(screen.getByTestId('multiselect-title-tags')).toHaveTextContent(
      'Tags'
    );
    expect(screen.getByTestId('multiselect-count-tags')).toHaveTextContent('1');
  });
});
