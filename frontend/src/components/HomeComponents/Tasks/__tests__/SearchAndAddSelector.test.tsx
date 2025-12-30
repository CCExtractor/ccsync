import { render, screen, within } from '@testing-library/react';
import { SearchAndAddSelector } from '../SearchAndAddSelector';
import userEvent from '@testing-library/user-event';

describe('SearchAndAddSelector Component', () => {
  const defaultProps = {
    options: ['Option 1', 'Option 2', 'Option 3'],
    selected: [] as string[],
    onChange: jest.fn(),
    placeholder: 'Search or create...',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders the combobox and shows placeholder when no items are selected', () => {
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');

      expect(combobox).toBeInTheDocument();
      expect(screen.getByText(defaultProps.placeholder)).toBeInTheDocument();
    });

    test('renders selected items instead of placeholder', () => {
      const selectedItems = ['Option 1', 'Option 2'];
      render(
        <SearchAndAddSelector {...defaultProps} selected={selectedItems} />
      );

      expect(
        screen.queryByText(defaultProps.placeholder)
      ).not.toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    test('popover options are not visible by default', () => {
      render(<SearchAndAddSelector {...defaultProps} />);

      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    });

    test('uses default placeholder when not provided', () => {
      const { options, selected, onChange } = defaultProps;
      render(
        <SearchAndAddSelector
          options={options}
          selected={selected}
          onChange={onChange}
        />
      );

      expect(screen.getByText('Search or create..')).toBeInTheDocument();
    });
  });

  describe('Popover Behavior', () => {
    test('opens popover when combobox is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      expect(await screen.findByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    test('closes popover when clicking outside', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      expect(await screen.findByText('Option 1')).toBeInTheDocument();

      await user.keyboard('{escape}');

      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    });
  });

  describe('Option Selection Behavior', () => {
    test('selecting an option calls onChange with that option', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const option1 = await screen.findByText('Option 1');
      await user.click(option1);

      expect(defaultProps.onChange).toHaveBeenCalledWith(['Option 1']);
    });

    test('can select multiple items', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const option1 = await screen.findByText('Option 1');
      const option2 = screen.getByText('Option 2');

      await user.click(option1);
      await user.click(option2);

      expect(defaultProps.onChange).toHaveBeenNthCalledWith(1, ['Option 1']);
      expect(defaultProps.onChange).toHaveBeenNthCalledWith(2, ['Option 2']);
    });

    test('clicking an already-selected option removes it', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      const { rerender } = render(
        <SearchAndAddSelector {...defaultProps} onChange={onChange} />
      );

      await user.click(screen.getByRole('combobox'));
      await user.click(await screen.findByText('Option 1'));

      expect(onChange).toHaveBeenNthCalledWith(1, ['Option 1']);

      rerender(
        <SearchAndAddSelector
          {...defaultProps}
          selected={['Option 1']}
          onChange={onChange}
        />
      );

      const popover = screen.getByRole('dialog');
      await user.click(within(popover).getByText('Option 1'));

      expect(onChange).toHaveBeenNthCalledWith(2, []);
    });
  });

  describe('Removing Items', () => {
    test('clicking the remove button on a selected item removes it', async () => {
      const user = userEvent.setup();

      render(
        <SearchAndAddSelector {...defaultProps} selected={['Option 1']} />
      );

      const selectedTag = screen.getByText('Option 1');
      const removeButton = selectedTag.querySelector('svg');
      await user.click(removeButton!);

      expect(defaultProps.onChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Search and Filtering', () => {
    test('filters options based on search input', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText(defaultProps.placeholder);
      await user.type(searchInput, '2');

      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      expect(await screen.findByText('Option 2')).toBeInTheDocument();
    });

    test('shows create option when search input does not match any option', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText(defaultProps.placeholder);
      await user.type(searchInput, 'new Option');

      expect(
        await screen.findByText('Create "new Option"')
      ).toBeInTheDocument();
    });

    test('search is case-insensitive', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText(defaultProps.placeholder);
      await user.type(searchInput, 'option 1');

      expect(await screen.findByText('Option 1')).toBeInTheDocument();
    });

    test('clearing search input restores all options', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText(defaultProps.placeholder);
      await user.type(searchInput, '2');

      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();

      await user.clear(searchInput);

      expect(await screen.findByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });
  });

  describe('Creating New Items', () => {
    test('clicking create option calls onChange with new item', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText(defaultProps.placeholder);
      await user.type(searchInput, 'new Option');

      const createOption = await screen.findByText('Create "new Option"');
      await user.click(createOption);

      expect(defaultProps.onChange).toHaveBeenCalledWith(['new Option']);
    });

    test('pressing Enter creates a new item', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText(defaultProps.placeholder);
      await user.type(searchInput, 'another Option{enter}');

      expect(defaultProps.onChange).toHaveBeenCalledWith(['another Option']);
    });

    test('does not show create option if item already exists', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText(defaultProps.placeholder);
      await user.type(searchInput, 'Option 1');

      expect(screen.queryByText('Create "Option 1"')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty options array', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} options={[]} />);

      await user.click(screen.getByRole('combobox'));

      expect(await screen.findByText('No results found.')).toBeInTheDocument();
    });

    test('does not create item for whitespace-only input', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText(defaultProps.placeholder);
      await user.type(searchInput, '   {enter}');

      expect(defaultProps.onChange).not.toHaveBeenCalled();
    });

    test('clicking remove button does not open popover', async () => {
      const user = userEvent.setup();
      render(
        <SearchAndAddSelector {...defaultProps} selected={['Option 1']} />
      );

      const selectedTag = screen.getByText('Option 1');
      const removeButton = selectedTag.querySelector('svg');
      await user.click(removeButton!);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('does not add duplicate when item already selected', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <SearchAndAddSelector
          {...defaultProps}
          options={['existingItem']}
          selected={['existingItem']}
          onChange={onChange}
        />
      );
      await user.click(screen.getByRole('combobox'));

      const searchInput = screen.getByPlaceholderText(defaultProps.placeholder);
      await user.type(searchInput, 'existingItem{enter}');

      expect(onChange).not.toHaveBeenCalled();
    });

    test('clears input after creating item', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText(defaultProps.placeholder);
      await user.type(searchInput, 'new item{enter}');

      expect(defaultProps.onChange).toHaveBeenCalledWith(['new item']);
      expect(searchInput).toHaveValue('');
    });

    test('trims whitespace when creating new item', async () => {
      const user = userEvent.setup();
      render(<SearchAndAddSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText(defaultProps.placeholder);
      await user.type(searchInput, '   trimmed item   {enter}');

      expect(defaultProps.onChange).toHaveBeenCalledWith(['trimmed item']);
    });
  });
});
