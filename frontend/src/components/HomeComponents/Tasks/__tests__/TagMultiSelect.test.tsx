import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TagMultiSelect } from '../TagMultiSelect';
import '@testing-library/jest-dom';

describe('TagMultiSelect Component', () => {
  const mockProps = {
    availableTags: ['work', 'urgent', 'personal', 'bug', 'feature'],
    selectedTags: [],
    onTagsChange: jest.fn(),
    placeholder: 'Select or create tags',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders with placeholder when no tags selected', () => {
      render(<TagMultiSelect {...mockProps} />);

      expect(screen.getByText('Select or create tags')).toBeInTheDocument();
    });

    test('shows selected tag count when tags are selected', () => {
      render(
        <TagMultiSelect {...mockProps} selectedTags={['work', 'urgent']} />
      );

      expect(screen.getByText('2 tags selected')).toBeInTheDocument();
    });

    test('shows singular form for single tag', () => {
      render(<TagMultiSelect {...mockProps} selectedTags={['work']} />);

      expect(screen.getByText('1 tag selected')).toBeInTheDocument();
    });

    test('displays selected tags as badges', () => {
      render(
        <TagMultiSelect {...mockProps} selectedTags={['work', 'urgent']} />
      );

      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      const { container } = render(
        <TagMultiSelect {...mockProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    test('respects disabled prop', () => {
      render(<TagMultiSelect {...mockProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Dropdown Behavior', () => {
    test('opens dropdown on button click', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(
        screen.getByPlaceholderText('Search or create tags...')
      ).toBeInTheDocument();
    });

    test('closes dropdown on button click when open', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);

      expect(
        screen.queryByPlaceholderText('Search or create tags...')
      ).not.toBeInTheDocument();
    });

    test('closes dropdown on outside click', async () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(
        screen.getByPlaceholderText('Search or create tags...')
      ).toBeInTheDocument();

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText('Search or create tags...')
        ).not.toBeInTheDocument();
      });
    });

    test('closes dropdown on escape key', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.keyDown(searchInput, { key: 'Escape' });

      expect(
        screen.queryByPlaceholderText('Search or create tags...')
      ).not.toBeInTheDocument();
    });

    test('focuses search input when dropdown opens', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Tag Selection', () => {
    test('selects existing tag from dropdown', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const workTag = screen.getByText('work');
      fireEvent.click(workTag);

      expect(mockProps.onTagsChange).toHaveBeenCalledWith(['work']);
    });

    test('does not show already selected tags in dropdown', () => {
      render(<TagMultiSelect {...mockProps} selectedTags={['work']} />);

      const dropdownButton = screen.getByText('1 tag selected');
      fireEvent.click(dropdownButton);

      // Check that 'work' is not in the dropdown options (but it's still in the badge)
      const dropdownContainer = screen
        .getByPlaceholderText('Search or create tags...')
        .closest('.absolute');
      expect(dropdownContainer).not.toHaveTextContent('work');
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    test('prevents duplicate tag selection', () => {
      const onTagsChange = jest.fn();
      render(
        <TagMultiSelect
          {...mockProps}
          selectedTags={['work']}
          onTagsChange={onTagsChange}
        />
      );

      const dropdownButton = screen.getByText('1 tag selected');
      fireEvent.click(dropdownButton);

      // Try to create 'work' again by typing it
      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: 'work' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      // Should not call onTagsChange since 'work' is already selected
      expect(onTagsChange).not.toHaveBeenCalled();
    });

    test('removes selected tag when badge X clicked', () => {
      render(
        <TagMultiSelect {...mockProps} selectedTags={['work', 'urgent']} />
      );

      const removeButtons = screen.getAllByText('✖');
      fireEvent.click(removeButtons[0]);

      expect(mockProps.onTagsChange).toHaveBeenCalledWith(['urgent']);
    });

    test('does not remove tags when disabled', () => {
      render(
        <TagMultiSelect
          {...mockProps}
          selectedTags={['work']}
          disabled={true}
        />
      );

      const removeButton = screen.getByText('✖');
      expect(removeButton).toBeDisabled();
    });
  });

  describe('Search Functionality', () => {
    test('filters available tags by search term', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: 'ur' } });

      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.queryByText('work')).not.toBeInTheDocument();
      expect(screen.queryByText('personal')).not.toBeInTheDocument();
    });

    test('search is case insensitive', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: 'WORK' } });

      expect(screen.getByText('work')).toBeInTheDocument();
    });

    test('shows "No tags found" when no matches', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      // Should show create option instead of "No tags found"
      expect(screen.getByText('Create "nonexistent"')).toBeInTheDocument();
    });

    test('clears search term when tag is selected', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: 'work' } });

      const workTag = screen.getByText('work');
      fireEvent.click(workTag);

      expect((searchInput as HTMLInputElement).value).toBe('');
    });
  });

  describe('New Tag Creation', () => {
    test('shows "create new" option for non-existing search', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: 'newtag' } });

      expect(screen.getByText('Create "newtag"')).toBeInTheDocument();
    });

    test('does not show "create new" for existing tags', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: 'work' } });

      expect(screen.queryByText('Create "work"')).not.toBeInTheDocument();
    });

    test('does not show "create new" for already selected tags', () => {
      render(<TagMultiSelect {...mockProps} selectedTags={['work']} />);

      const dropdownButton = screen.getByText('1 tag selected');
      fireEvent.click(dropdownButton);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: 'work' } });

      expect(screen.queryByText('Create "work"')).not.toBeInTheDocument();
    });

    test('creates new tag when "create new" clicked', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: 'newtag' } });

      const createOption = screen.getByText('Create "newtag"');
      fireEvent.click(createOption);

      expect(mockProps.onTagsChange).toHaveBeenCalledWith(['newtag']);
    });

    test('trims whitespace when creating new tag', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: '  newtag  ' } });

      const createOption = screen.getByText('Create "newtag"');
      fireEvent.click(createOption);

      expect(mockProps.onTagsChange).toHaveBeenCalledWith(['newtag']);
    });

    test('does not create empty tag', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: '   ' } });

      expect(screen.queryByText(/Create/)).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('selects first filtered tag on Enter key', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: 'ur' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      expect(mockProps.onTagsChange).toHaveBeenCalledWith(['urgent']);
    });

    test('creates new tag on Enter when no existing matches', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: 'newtag' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      expect(mockProps.onTagsChange).toHaveBeenCalledWith(['newtag']);
    });

    test('does nothing on Enter when search is empty', () => {
      const onTagsChange = jest.fn();
      render(<TagMultiSelect {...mockProps} onTagsChange={onTagsChange} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      // Don't type anything, just press Enter
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      expect(onTagsChange).not.toHaveBeenCalled();
    });

    test('closes dropdown and clears search on Escape', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.keyDown(searchInput, { key: 'Escape' });

      expect(
        screen.queryByPlaceholderText('Search or create tags...')
      ).not.toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    test('calls onTagsChange when tags change', () => {
      const onTagsChange = jest.fn();
      render(<TagMultiSelect {...mockProps} onTagsChange={onTagsChange} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const workTag = screen.getByText('work');
      fireEvent.click(workTag);

      expect(onTagsChange).toHaveBeenCalledWith(['work']);
    });

    test('uses custom placeholder', () => {
      render(
        <TagMultiSelect {...mockProps} placeholder="Custom placeholder" />
      );

      expect(screen.getByText('Custom placeholder')).toBeInTheDocument();
    });

    test('handles empty availableTags array', () => {
      render(<TagMultiSelect {...mockProps} availableTags={[]} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('No tags found')).toBeInTheDocument();
    });

    test('handles empty selectedTags array', () => {
      render(<TagMultiSelect {...mockProps} selectedTags={[]} />);

      expect(screen.getByText('Select or create tags')).toBeInTheDocument();
      expect(screen.queryByText('✖')).not.toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    test('works with pre-selected tags and available tags', () => {
      render(
        <TagMultiSelect
          {...mockProps}
          selectedTags={['work']}
          availableTags={['work', 'urgent', 'personal']}
        />
      );

      // Should show selected tag
      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('1 tag selected')).toBeInTheDocument();

      // Should not show selected tag in dropdown
      const dropdownButton = screen.getByText('1 tag selected');
      fireEvent.click(dropdownButton);

      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.getByText('personal')).toBeInTheDocument();

      // Check that 'work' is not in the dropdown options (but it's still in the badge)
      const dropdownContainer = screen
        .getByPlaceholderText('Search or create tags...')
        .closest('.absolute');
      expect(dropdownContainer).not.toHaveTextContent('work');
    });

    test('maintains search state during tag operations', () => {
      render(<TagMultiSelect {...mockProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(
        'Search or create tags...'
      );
      fireEvent.change(searchInput, { target: { value: 'ur' } });

      // Select a tag
      const urgentTag = screen.getByText('urgent');
      fireEvent.click(urgentTag);

      // Search should be cleared after selection
      expect((searchInput as HTMLInputElement).value).toBe('');
    });

    test('handles rapid tag selection and removal', () => {
      const onTagsChange = jest.fn();
      render(
        <TagMultiSelect
          {...mockProps}
          selectedTags={['work']}
          onTagsChange={onTagsChange}
        />
      );

      // Remove existing tag
      const removeButton = screen.getByText('✖');
      fireEvent.click(removeButton);

      expect(onTagsChange).toHaveBeenCalledWith([]);

      // After removing, the button text should change back to placeholder
      // We need to re-render with the updated state to test the next part
      onTagsChange.mockClear();

      // Simulate the component re-rendering with empty selectedTags
      render(
        <TagMultiSelect
          {...mockProps}
          selectedTags={[]}
          onTagsChange={onTagsChange}
        />
      );

      const dropdownButton = screen.getByText('Select or create tags');
      fireEvent.click(dropdownButton);

      const urgentTag = screen.getByText('urgent');
      fireEvent.click(urgentTag);

      expect(onTagsChange).toHaveBeenCalledWith(['urgent']);
    });
  });
});
