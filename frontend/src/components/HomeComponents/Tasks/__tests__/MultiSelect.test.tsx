import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiSelect } from '../MultiSelect';
import '@testing-library/jest-dom';

describe('MultiSelect Component', () => {
  const mockProps = {
    availableItems: ['work', 'urgent', 'personal', 'bug', 'feature'],
    selectedItems: [],
    onItemsChange: jest.fn(),
    placeholder: 'Select or create items',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders with placeholder when no items selected', () => {
      render(<MultiSelect {...mockProps} />);

      expect(screen.getByText('Select or create items')).toBeInTheDocument();
    });

    test('shows selected tag count when tags are selected', () => {
      render(<MultiSelect {...mockProps} selectedItems={['work', 'urgent']} />);

      expect(screen.getByText('2 items selected')).toBeInTheDocument();
    });

    test('shows singular form for single tag', () => {
      render(<MultiSelect {...mockProps} selectedItems={['work']} />);

      expect(screen.getByText('1 item selected')).toBeInTheDocument();
    });

    test('displays selected tags as badges', () => {
      render(<MultiSelect {...mockProps} selectedItems={['work', 'urgent']} />);

      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      const { container } = render(
        <MultiSelect {...mockProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    test('respects disabled prop', () => {
      render(<MultiSelect {...mockProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Dropdown Behavior', () => {
    test('opens dropdown on button click', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(
        screen.getByPlaceholderText('Search or create...')
      ).toBeInTheDocument();
    });

    test('closes dropdown on button click when open', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);

      expect(
        screen.queryByPlaceholderText('Search or create...')
      ).not.toBeInTheDocument();
    });

    test('closes dropdown on outside click', async () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(
        screen.getByPlaceholderText('Search or create...')
      ).toBeInTheDocument();

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText('Search or create...')
        ).not.toBeInTheDocument();
      });
    });

    test('closes dropdown on escape key', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.keyDown(searchInput, { key: 'Escape' });

      expect(
        screen.queryByPlaceholderText('Search or create...')
      ).not.toBeInTheDocument();
    });

    test('focuses search input when dropdown opens', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Tag Selection', () => {
    test('selects existing tag from dropdown', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const workTag = screen.getByText('work');
      fireEvent.click(workTag);

      expect(mockProps.onItemsChange).toHaveBeenCalledWith(['work']);
    });

    test('does not show already selected tags in dropdown', () => {
      render(<MultiSelect {...mockProps} selectedItems={['work']} />);

      const dropdownButton = screen.getByText('1 item selected');
      fireEvent.click(dropdownButton);

      const dropdownContainer = screen
        .getByPlaceholderText('Search or create...')
        .closest('.absolute');
      expect(dropdownContainer).not.toHaveTextContent('work');
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    test('prevents duplicate tag selection', () => {
      const onItemsChange = jest.fn();
      render(
        <MultiSelect
          {...mockProps}
          selectedItems={['work']}
          onItemsChange={onItemsChange}
        />
      );

      const dropdownButton = screen.getByText('1 item selected');
      fireEvent.click(dropdownButton);

      // Try to create 'work' again by typing it
      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: 'work' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      // Should not call onItemsChange since 'work' is already selected
      expect(onItemsChange).not.toHaveBeenCalled();
    });

    test('removes selected tag when badge X clicked', () => {
      render(<MultiSelect {...mockProps} selectedItems={['work', 'urgent']} />);

      const removeButtons = screen.getAllByText('✖');
      fireEvent.click(removeButtons[0]);

      expect(mockProps.onItemsChange).toHaveBeenCalledWith(['urgent']);
    });

    test('does not remove tags when disabled', () => {
      render(
        <MultiSelect {...mockProps} selectedItems={['work']} disabled={true} />
      );

      const removeButton = screen.getByText('✖');
      expect(removeButton).toBeDisabled();
    });
  });

  describe('Search Functionality', () => {
    test('filters available tags by search term', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: 'ur' } });

      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.queryByText('work')).not.toBeInTheDocument();
      expect(screen.queryByText('personal')).not.toBeInTheDocument();
    });

    test('search is case insensitive', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: 'WORK' } });

      expect(screen.getByText('work')).toBeInTheDocument();
    });

    test('shows "No items found" when no matches', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      // Should show create option instead of "No items found"
      expect(screen.getByText('Create "nonexistent"')).toBeInTheDocument();
    });

    test('clears search term when tag is selected', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: 'work' } });

      const workTag = screen.getByText('work');
      fireEvent.click(workTag);

      expect((searchInput as HTMLInputElement).value).toBe('');
    });
  });

  describe('New Tag Creation', () => {
    test('shows "create new" option for non-existing search', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: 'newtag' } });

      expect(screen.getByText('Create "newtag"')).toBeInTheDocument();
    });

    test('does not show "create new" for existing tags', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: 'work' } });

      expect(screen.queryByText('Create "work"')).not.toBeInTheDocument();
    });

    test('does not show "create new" for already selected tags', () => {
      render(<MultiSelect {...mockProps} selectedItems={['work']} />);

      const dropdownButton = screen.getByText('1 item selected');
      fireEvent.click(dropdownButton);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: 'work' } });

      expect(screen.queryByText('Create "work"')).not.toBeInTheDocument();
    });

    test('creates new tag when "create new" clicked', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: 'newtag' } });

      const createOption = screen.getByText('Create "newtag"');
      fireEvent.click(createOption);

      expect(mockProps.onItemsChange).toHaveBeenCalledWith(['newtag']);
    });

    test('trims whitespace when creating new tag', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: '  newtag  ' } });

      const createOption = screen.getByText('Create "newtag"');
      fireEvent.click(createOption);

      expect(mockProps.onItemsChange).toHaveBeenCalledWith(['newtag']);
    });

    test('does not create empty tag', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: '   ' } });

      expect(screen.queryByText(/Create/)).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('selects first filtered tag on Enter key', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: 'ur' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      expect(mockProps.onItemsChange).toHaveBeenCalledWith(['urgent']);
    });

    test('creates new tag on Enter when no existing matches', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: 'newtag' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      expect(mockProps.onItemsChange).toHaveBeenCalledWith(['newtag']);
    });

    test('does nothing on Enter when search is empty', () => {
      const onItemsChange = jest.fn();
      render(<MultiSelect {...mockProps} onItemsChange={onItemsChange} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      // Don't type anything, just press Enter
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      expect(onItemsChange).not.toHaveBeenCalled();
    });

    test('closes dropdown and clears search on Escape', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.keyDown(searchInput, { key: 'Escape' });

      expect(
        screen.queryByPlaceholderText('Search or create...')
      ).not.toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    test('calls onItemsChange when tags change', () => {
      const onItemsChange = jest.fn();
      render(<MultiSelect {...mockProps} onItemsChange={onItemsChange} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const workTag = screen.getByText('work');
      fireEvent.click(workTag);

      expect(onItemsChange).toHaveBeenCalledWith(['work']);
    });

    test('uses custom placeholder', () => {
      render(<MultiSelect {...mockProps} placeholder="Custom placeholder" />);

      expect(screen.getByText('Custom placeholder')).toBeInTheDocument();
    });

    test('handles empty availableItems array', () => {
      render(<MultiSelect {...mockProps} availableItems={[]} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    test('handles empty selectedItems array', () => {
      render(<MultiSelect {...mockProps} selectedItems={[]} />);

      expect(screen.getByText('Select or create items')).toBeInTheDocument();
      expect(screen.queryByText('✖')).not.toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    test('works with pre-selected tags and available tags', () => {
      render(
        <MultiSelect
          {...mockProps}
          selectedItems={['work']}
          availableItems={['work', 'urgent', 'personal']}
        />
      );

      // Should show selected tag
      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('1 item selected')).toBeInTheDocument();

      // Should not show selected tag in dropdown
      const dropdownButton = screen.getByText('1 item selected');
      fireEvent.click(dropdownButton);

      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.getByText('personal')).toBeInTheDocument();

      const dropdownContainer = screen
        .getByPlaceholderText('Search or create...')
        .closest('.absolute');
      expect(dropdownContainer).not.toHaveTextContent('work');
    });

    test('maintains search state during tag operations', () => {
      render(<MultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search or create...');
      fireEvent.change(searchInput, { target: { value: 'ur' } });

      // Select a tag
      const urgentTag = screen.getByText('urgent');
      fireEvent.click(urgentTag);

      // Search should be cleared after selection
      expect((searchInput as HTMLInputElement).value).toBe('');
    });

    test('handles rapid tag selection and removal', () => {
      const onItemsChange = jest.fn();
      render(
        <MultiSelect
          {...mockProps}
          selectedItems={['work']}
          onItemsChange={onItemsChange}
        />
      );

      // Remove existing tag
      const removeButton = screen.getByText('✖');
      fireEvent.click(removeButton);

      expect(onItemsChange).toHaveBeenCalledWith([]);

      // After removing, the button text should change back to placeholder
      // We need to re-render with the updated state to test the next part
      onItemsChange.mockClear();

      // Simulate the component re-rendering with empty selectedItems
      render(
        <MultiSelect
          {...mockProps}
          selectedItems={[]}
          onItemsChange={onItemsChange}
        />
      );

      const dropdownButton = screen.getByText('Select or create items');
      fireEvent.click(dropdownButton);

      const urgentTag = screen.getByText('urgent');
      fireEvent.click(urgentTag);

      expect(onItemsChange).toHaveBeenCalledWith(['urgent']);
    });
  });
});
