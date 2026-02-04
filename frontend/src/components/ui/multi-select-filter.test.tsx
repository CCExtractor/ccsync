import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelectFilter } from '../ui/multi-select';
import '@testing-library/jest-dom';

describe('MultiSelectFilter', () => {
  const mockOptions = ['Option A', 'Option B', 'Option C'];
  const mockOnSelectionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with title and placeholder when no options selected', () => {
    render(
      <MultiSelectFilter
        title="Test Filter"
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('Test Filter')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument(); // The button serves as a combobox trigger
  });

  it('renders with selected values', () => {
    render(
      <MultiSelectFilter
        title="Test Filter"
        options={mockOptions}
        selectedValues={['Option A', 'Option C']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Since selected values are visually indicated by checkboxes in the popover (which is closed),
    // and potentially by a badge or count on the button (depending on implementation),
    // let's check if the component renders without error first.
    // Inspecting the component, it doesn't seem to show selected count on the button in this version, just the title.
    // So we rely on the internal logic validation in interaction tests or if we open the popover.
    // For this render test, ensuring it mounts with props is the baseline.
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <MultiSelectFilter
        title="Test Filter"
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        className="custom-class"
      />
    );

    expect(screen.getByRole('combobox')).toHaveClass('custom-class');
  });

  it('renders icon when provided', () => {
    const icon = <span data-testid="test-icon">Icon</span>;
    render(
      <MultiSelectFilter
        title="Test Filter"
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        icon={icon}
      />
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('displays completion stats correctly', async () => {
    const user = userEvent.setup();
    const completionStats = {
      'Option A': { completed: 5, total: 10, percentage: 50 },
    };

    render(
      <MultiSelectFilter
        title="Test Filter"
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        completionStats={completionStats}
      />
    );

    // Open popover to see options and stats
    await user.click(screen.getByRole('combobox'));

    expect(screen.getByText('5/10 tasks, 50%')).toBeInTheDocument();
  });

  it('opens and closes the popover', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelectFilter
        title="Test Filter"
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const button = screen.getByRole('combobox');

    // Open
    await user.click(button);
    expect(screen.getByText('All Test Filter')).toBeInTheDocument();

    // Close by clicking button again
    await user.click(button);
    expect(screen.queryByText('All Test Filter')).not.toBeInTheDocument();

    // Open again
    await user.click(button);
    expect(screen.getByText('All Test Filter')).toBeInTheDocument();

    // Close by Escape
    await user.keyboard('{Escape}');
    expect(screen.queryByText('All Test Filter')).not.toBeInTheDocument();
  });

  it('selects and deselects options', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelectFilter
        title="Test Filter"
        options={mockOptions}
        selectedValues={['Option A']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const button = screen.getByRole('combobox');
    await user.click(button);

    // Select unselected option
    await user.click(screen.getByText('Option B'));
    expect(mockOnSelectionChange).toHaveBeenCalledWith([
      'Option A',
      'Option B',
    ]);

    // Deselect selected option
    await user.click(screen.getByText('Option A'));
    expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
  });

  it('clears selection when "All" option is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelectFilter
        title="Test Filter"
        options={mockOptions}
        selectedValues={['Option A']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const button = screen.getByRole('combobox');
    await user.click(button);

    await user.click(screen.getByText('All Test Filter'));
    expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
  });

  it('filters options based on search input', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelectFilter
        title="Test Filter"
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await user.click(screen.getByRole('combobox'));
    const searchInput = screen.getByPlaceholderText('Search test filter...');

    await user.type(searchInput, 'Option A');

    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.queryByText('Option B')).not.toBeInTheDocument();
  });

  it('displays "No results found" for no matches', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelectFilter
        title="Test Filter"
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await user.click(screen.getByRole('combobox'));
    const searchInput = screen.getByPlaceholderText('Search test filter...');

    await user.type(searchInput, 'Non-existent Option');

    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });

  it('search is case-insensitive', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelectFilter
        title="Test Filter"
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await user.click(screen.getByRole('combobox'));
    const searchInput = screen.getByPlaceholderText('Search test filter...');

    await user.type(searchInput, 'option a');

    expect(screen.getByText('Option A')).toBeInTheDocument();
  });
});
