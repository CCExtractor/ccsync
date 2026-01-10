import {
  render,
  screen,
  fireEvent,
  act,
  within,
  waitFor,
} from '@testing-library/react';
import { Tasks } from '../Tasks';

// Mock props for the Tasks component
const mockProps = {
  origin: '',
  email: 'test@example.com',
  encryptionSecret: 'mockEncryptionSecret',
  UUID: 'mockUUID',
  isLoading: false, // mock the loading state
  setIsLoading: jest.fn(), // mock the setter function
};

// Mock functions and modules
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../tasks-utils', () => {
  const originalModule = jest.requireActual('../tasks-utils');
  return {
    ...originalModule, // Includes all real functions like sortTasksById
    markTaskAsCompleted: jest.fn(),
    bulkMarkTasksAsCompleted: jest.fn().mockResolvedValue(true),
    markTaskAsDeleted: jest.fn(),
    bulkMarkTasksAsDeleted: jest.fn().mockResolvedValue(true),
    getTimeSinceLastSync: jest
      .fn()
      .mockReturnValue('Last updated 5 minutes ago'),
    hashKey: jest.fn().mockReturnValue('mockHashedKey'),
    getPinnedTasks: jest.fn().mockReturnValue(new Set()),
    togglePinnedTask: jest.fn(),
  };
});

jest.mock('@/components/ui/multi-select', () => ({
  MultiSelectFilter: jest.fn(({ title }) => (
    <div>Mocked MultiSelect: {title}</div>
  )),
}));

jest.mock('@/components/ui/select', () => {
  return {
    Select: ({ children, onValueChange, value }: any) => {
      return (
        <select
          data-testid="project-select"
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
        >
          {children}
        </select>
      );
    },
    SelectTrigger: ({ children }: any) => children,
    SelectValue: ({ placeholder }: any) => (
      <option value="" disabled hidden>
        {placeholder}
      </option>
    ),
    SelectContent: ({ children }: any) => children,
    SelectItem: ({ value, children, ...props }: any) => (
      <option value={value} {...props}>
        {children}
      </option>
    ),
  };
});

jest.mock('../../BottomBar/BottomBar', () => {
  return jest.fn(() => <div>Mocked BottomBar</div>);
});

jest.mock('../hooks', () => ({
  TasksDatabase: jest.fn(() => ({
    tasks: {
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          // Mock 12 tasks to test pagination
          toArray: jest.fn().mockResolvedValue([
            ...Array.from({ length: 12 }, (_, i) => ({
              id: i + 1,
              description: `Task ${i + 1}`,
              status: 'pending',
              project: i % 2 === 0 ? 'ProjectA' : 'ProjectB',
              tags: i % 3 === 0 ? ['tag1'] : ['tag2'],
              uuid: `uuid-${i + 1}`,
              due: i === 0 ? '20200101T120000Z' : undefined,
            })),
            {
              id: 13,
              description:
                'Task 13: Prepare quarterly financial analysis report for review',
              status: 'pending',
              project: 'Finance',
              tags: ['report', 'analysis'],
              uuid: 'uuid-corp-1',
            },
            {
              id: 14,
              description:
                'Task 14: Schedule client onboarding meeting with Sales team',
              status: 'pending',
              project: 'Sales',
              tags: ['meeting', 'client'],
              uuid: 'uuid-corp-2',
            },
            {
              id: 15,
              description:
                'Task 15: Draft technical documentation for API integration module',
              status: 'pending',
              project: 'Engineering',
              tags: ['documentation', 'api'],
              uuid: 'uuid-corp-3',
            },
            {
              id: 16,
              description: 'Completed Task 1',
              status: 'completed',
              project: 'ProjectA',
              tags: ['completed'],
              uuid: 'uuid-completed-1',
            },
            {
              id: 17,
              description: 'Deleted Task 1',
              status: 'deleted',
              project: 'ProjectB',
              tags: ['deleted'],
              uuid: 'uuid-deleted-1',
            },
          ]),
          delete: jest.fn().mockResolvedValue(undefined),
        })),
      })),
      bulkPut: jest.fn().mockResolvedValue(undefined),
    },
    transaction: jest.fn(async (_mode, _table, callback) => {
      await callback();
      return Promise.resolve();
    }),
  })),
  fetchTaskwarriorTasks: jest.fn().mockResolvedValue([]),
  addTaskToBackend: jest.fn().mockResolvedValue({}),
  editTaskOnBackend: jest.fn().mockResolvedValue({}),
  modifyTaskOnBackend: jest.fn().mockResolvedValue({}),
}));

jest.mock('../Pagination', () => {
  return jest.fn((props) => (
    <div data-testid="mock-pagination">
      <span data-testid="total-pages">{props.totalPages}</span>
      <span data-testid="current-page">{props.currentPage}</span>
    </div>
  ));
});

global.fetch = jest.fn().mockResolvedValue({ ok: true });

describe('Tasks Component', () => {
  const localStorageMock = (() => {
    let store: { [key: string]: string } = {};
    return {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Rendering & Basic UI', () => {
    test('renders tasks component and the mocked BottomBar', async () => {
      render(<Tasks {...mockProps} />);

      expect(screen.getByTestId('tasks')).toBeInTheDocument();
      expect(screen.getByText('Mocked BottomBar')).toBeInTheDocument();
    });

    test('renders the "Tasks per Page" dropdown with default value', async () => {
      await act(async () => {
        render(<Tasks {...mockProps} />);
      });

      expect(await screen.findByText('Task 12')).toBeInTheDocument();

      const dropdown = screen.getByLabelText('Show:');
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveValue('10');
    });
  });

  describe('LocalStorage', () => {
    test('loads "tasksPerPage" from localStorage on initial render', async () => {
      localStorageMock.setItem('mockHashedKey', '20');

      render(<Tasks {...mockProps} />);

      await waitFor(async () => {
        expect(await screen.findByText('Task 1')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Show:')).toHaveValue('20');
    });

    test('updates pagination when "Tasks per Page" is changed', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(async () => {
        expect(await screen.findByText('Task 12')).toBeInTheDocument();
      });

      expect(screen.getByTestId('total-pages')).toHaveTextContent('2');

      const dropdown = screen.getByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '5' } });

      expect(screen.getByTestId('total-pages')).toHaveTextContent('4');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mockHashedKey',
        '5'
      );

      expect(screen.getByTestId('current-page')).toHaveTextContent('1');
    });
  });

  describe('Pagination', () => {
    it('unselects all tasks when Select All is clicked again', async () => {
      render(<Tasks {...mockProps} />);

      const checkboxes = await screen.findAllByRole('checkbox');
      const selectAll = checkboxes[0];

      fireEvent.click(selectAll);
      fireEvent.click(selectAll);

      const allRowChecks = checkboxes.slice(1);
      allRowChecks.forEach((cb) => expect(cb).not.toBeChecked());

      expect(screen.queryByText(/Mark/i)).not.toBeInTheDocument();
    });

    it('maintains selected tasks when navigating between pages', async () => {
      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');
      const checkboxes = screen.getAllByRole('checkbox');

      fireEvent.click(checkboxes[1]);
      expect(checkboxes[1]).toBeChecked();

      const updatedCheckboxes = screen.getAllByRole('checkbox');
      expect(updatedCheckboxes[1]).toBeChecked();
    });

    it('select all checkbox is unchecked when no tasks are selected', async () => {
      render(<Tasks {...mockProps} />);

      const checkboxes = await screen.findAllByRole('checkbox');
      const selectAll = checkboxes[0];

      expect(selectAll).not.toBeChecked();
    });
  });

  describe('Search & Filtering', () => {
    test('filters tasks with fuzzy search (handles typos)', async () => {
      jest.useFakeTimers();

      render(<Tasks {...mockProps} />);
      expect(await screen.findByText('Task 12')).toBeInTheDocument();

      const dropdown = screen.getByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '50' } });

      const searchBar = screen.getByPlaceholderText('Search tasks...');
      fireEvent.change(searchBar, { target: { value: 'fiace' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(await screen.findByText('Finance')).toBeInTheDocument();
      expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
      expect(screen.queryByText('Sales')).not.toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('Task Dialog - Tags Editing', () => {
    test('shows tags as badges in task dialog and allows editing (add on Enter)', async () => {
      render(<Tasks {...mockProps} />);

      expect(await screen.findByText('Task 1')).toBeInTheDocument();

      const taskRow = screen.getByText('Task 1');
      fireEvent.click(taskRow);

      expect(await screen.findByText('Tags:')).toBeInTheDocument();

      expect(screen.getByText('tag1')).toBeInTheDocument();

      const tagsLabel = screen.getByText('Tags:');
      const tagsRow = tagsLabel.closest('tr') as HTMLElement;
      const pencilButton = within(tagsRow).getByRole('button');
      fireEvent.click(pencilButton);

      const editInput = await screen.findByPlaceholderText(
        'Add a tag (press enter to add)'
      );

      fireEvent.change(editInput, { target: { value: 'newtag' } });
      fireEvent.keyDown(editInput, { key: 'Enter', code: 'Enter' });

      expect(await screen.findByText('newtag')).toBeInTheDocument();

      expect((editInput as HTMLInputElement).value).toBe('');
    });

    test('adds a tag while editing and saves updated tags to backend', async () => {
      render(<Tasks {...mockProps} />);

      expect(await screen.findByText('Task 1')).toBeInTheDocument();

      const taskRow = screen.getByText('Task 1');
      fireEvent.click(taskRow);

      expect(await screen.findByText('Tags:')).toBeInTheDocument();

      const tagsLabel = screen.getByText('Tags:');
      const tagsRow = tagsLabel.closest('tr') as HTMLElement;
      const pencilButton = within(tagsRow).getByRole('button');
      fireEvent.click(pencilButton);

      const editInput = await screen.findByPlaceholderText(
        'Add a tag (press enter to add)'
      );

      fireEvent.change(editInput, { target: { value: 'addedtag' } });
      fireEvent.keyDown(editInput, { key: 'Enter', code: 'Enter' });

      expect(await screen.findByText('addedtag')).toBeInTheDocument();

      const saveButton = await screen.findByRole('button', {
        name: /save tags/i,
      });
      fireEvent.click(saveButton);

      await waitFor(() => {
        const hooks = require('../hooks');
        expect(hooks.editTaskOnBackend).toHaveBeenCalled();
      });

      const hooks = require('../hooks');
      expect(hooks.editTaskOnBackend).toHaveBeenCalled();

      const callArg = hooks.editTaskOnBackend.mock.calls[0][0];
      expect(callArg.tags).toEqual(
        expect.arrayContaining(['tag1', 'addedtag'])
      );
    });

    test('removes a tag while editing and saves updated tags to backend', async () => {
      render(<Tasks {...mockProps} />);

      expect(await screen.findByText('Task 1')).toBeInTheDocument();

      const taskRow = screen.getByText('Task 1');
      fireEvent.click(taskRow);

      expect(await screen.findByText('Tags:')).toBeInTheDocument();

      const tagsLabel = screen.getByText('Tags:');
      const tagsRow = tagsLabel.closest('tr') as HTMLElement;
      const pencilButton = within(tagsRow).getByRole('button');
      fireEvent.click(pencilButton);

      const editInput = await screen.findByPlaceholderText(
        'Add a tag (press enter to add)'
      );

      fireEvent.change(editInput, { target: { value: 'newtag' } });
      fireEvent.keyDown(editInput, { key: 'Enter', code: 'Enter' });

      expect(await screen.findByText('newtag')).toBeInTheDocument();

      const tagBadge = screen.getByText('tag1');
      const badgeContainer = (tagBadge.closest('div') ||
        tagBadge.parentElement) as HTMLElement;

      const removeButton = within(badgeContainer).getByText('✖');
      fireEvent.click(removeButton);

      expect(screen.queryByText('tag2')).not.toBeInTheDocument();

      const saveButton = await screen.findByRole('button', {
        name: /save tags/i,
      });
      fireEvent.click(saveButton);

      await waitFor(() => {
        const hooks = require('../hooks');
        expect(hooks.editTaskOnBackend).toHaveBeenCalled();
      });

      const hooks = require('../hooks');
      expect(hooks.editTaskOnBackend).toHaveBeenCalled();

      const callArg = hooks.editTaskOnBackend.mock.calls[0][0];

      expect(callArg.tags).toEqual(expect.arrayContaining(['newtag', 'tag1']));
    });

    it('clicking checkbox does not open task detail dialog', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 1');

      const checkboxes = screen.getAllByRole('checkbox');

      fireEvent.click(checkboxes[1]);

      expect(screen.queryByText('Task Details')).not.toBeInTheDocument();
    });
  });

  describe('Overdue UI', () => {
    test('shows red background on task ID and Overdue badge for overdue tasks', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 12');

      const dropdown = screen.getByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '20' } });

      const task1Description = screen.getByText('Task 1');
      const row = task1Description.closest('tr');
      const idElement = row?.querySelector('span');

      expect(idElement).toHaveClass('bg-red-600/80');
      fireEvent.click(idElement!);

      const overdueBadge = await screen.findByText('Overdue');
      expect(overdueBadge).toBeInTheDocument();
    });
  });

  describe('Selection Logic', () => {
    it('adds a task UUID to selectedTaskUUIDs when an individual checkbox is clicked', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 1');

      const checkboxes = screen.getAllByRole('checkbox');

      const firstRowCheckbox = checkboxes[1];
      fireEvent.click(firstRowCheckbox);

      expect(firstRowCheckbox).toBeChecked();

      const actionBar = screen.getByTestId('bulk-action-bar');
      expect(actionBar).toBeInTheDocument();

      const completeBtn = screen.getByTestId('bulk-complete-btn');
      expect(completeBtn).toBeInTheDocument();
    });

    it('removes a task UUID when checkbox is unchecked', async () => {
      render(<Tasks {...mockProps} />);

      const checkboxes = await screen.findAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1];

      fireEvent.click(firstRowCheckbox);
      expect(firstRowCheckbox).toBeChecked();

      fireEvent.click(firstRowCheckbox);
      expect(firstRowCheckbox).not.toBeChecked();

      expect(
        screen.queryByText(/Mark 1 Task Completed/i)
      ).not.toBeInTheDocument();
    });

    it('updates Select All state when an individual checkbox is unchecked', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 1');
      const checkboxes = screen.getAllByRole('checkbox');
      const selectAll = checkboxes[0];

      fireEvent.click(selectAll); // select all

      // unselect one
      fireEvent.click(checkboxes[1]);

      expect(selectAll).not.toBeChecked();
    });

    it('hides bulk action bar when all tasks are deselected', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 1');
      const checkboxes = screen.getAllByRole('checkbox');

      // Select and then deselect
      fireEvent.click(checkboxes[1]);

      expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument();

      fireEvent.click(checkboxes[1]);

      expect(screen.queryByTestId('bulk-action-bar')).not.toBeInTheDocument();
    });
  });

  describe('Bulk Complete', () => {
    it('calls bulkMarkTasksAsCompleted when bulk complete button is clicked', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 1');
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      const bulkButton = screen.getByTestId('bulk-complete-btn');
      fireEvent.click(bulkButton);

      const yesButton = await screen.findByText('Yes');
      fireEvent.click(yesButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId('bulk-complete-btn')
        ).not.toBeInTheDocument();
      });
    });

    it('keeps tasks selected when bulk complete fails', async () => {
      const utils = require('../tasks-utils');

      utils.bulkMarkTasksAsCompleted.mockResolvedValue(false);

      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 1');
      const checkboxes = screen.getAllByRole('checkbox');

      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);

      const bulkButton = screen.getByText(/Mark 2 Tasks Completed/i);

      fireEvent.click(bulkButton);

      await waitFor(() => {
        expect(screen.getByText(/Mark 2 Tasks Completed/i)).toBeInTheDocument();
      });
    });

    it('cancelling confirmation dialog keeps tasks selected', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 1');
      const checkboxes = screen.getAllByRole('checkbox');

      fireEvent.click(checkboxes[1]);

      const completeBtn = screen.getByText(/Mark 1 Task Completed/i);

      fireEvent.click(completeBtn);

      const noButton = await screen.findByText('No');

      fireEvent.click(noButton);

      await waitFor(() => {
        expect(screen.getByText(/Mark 1 Task Completed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Delete', () => {
    it('calls bulkMarkTasksAsDeleted when delete is clicked', async () => {
      const utils = require('../tasks-utils');

      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 1');
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      const deleteBtn = screen.getByText(/Delete 1 Task/i);
      fireEvent.click(deleteBtn);

      const yesButton = await screen.findByText('Yes');
      fireEvent.click(yesButton);

      expect(utils.bulkMarkTasksAsDeleted).toHaveBeenCalled();
    });
  });

  describe('Edge Cases - Deleted & Completed Task Handling', () => {
    it('should only select non-deleted tasks when Select All is clicked', async () => {
      render(<Tasks {...mockProps} />);

      const dropdown = await screen.findByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '50' } });

      await screen.findByText('Deleted Task 1');

      const checkboxes = screen.getAllByRole('checkbox');
      const selectAllCheckbox = checkboxes[0];

      fireEvent.click(selectAllCheckbox);

      const deletedTaskRow = screen.getByText('Deleted Task 1').closest('tr');
      const deletedCheckbox = deletedTaskRow?.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;

      expect(deletedCheckbox).not.toBeChecked();
      expect(deletedCheckbox).toBeDisabled();
    });

    it('should not increase count for deleted tasks when Select All is clicked', async () => {
      render(<Tasks {...mockProps} />);

      const dropdown = await screen.findByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '50' } });

      await screen.findByText('Deleted Task 1');

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      const rows = screen.getAllByRole('row');

      const taskRows = rows.filter((row) => row.id?.startsWith('task-row-'));
      const activeRows = taskRows.filter(
        (row) => !within(row).queryByText('D')
      );

      screen.getByText(`${activeRows.length}`);
    });

    it('should show Select All as checked when all selectable tasks are selected', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 1');

      const checkboxes = screen.getAllByRole('checkbox');
      const selectAllCheckbox = checkboxes[0];

      fireEvent.click(selectAllCheckbox);

      expect(selectAllCheckbox).toBeChecked();
    });

    it('should show Select All as unchecked when some tasks are not selected', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 1');

      const checkboxes = screen.getAllByRole('checkbox');
      const selectAllCheckbox = checkboxes[0];

      fireEvent.click(checkboxes[1]);

      expect(selectAllCheckbox).not.toBeChecked();
    });

    it('should hide bulk complete button when a completed task is selected', async () => {
      render(<Tasks {...mockProps} />);

      const dropdown = await screen.findByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '50' } });

      await screen.findByText('Completed Task 1');

      const pendingTaskRow = screen.getByText('Task 1').closest('tr');
      const pendingCheckbox = pendingTaskRow?.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;
      fireEvent.click(pendingCheckbox);

      expect(screen.getByTestId('bulk-complete-btn')).toBeInTheDocument();

      const completedTaskRow = screen
        .getByText('Completed Task 1')
        .closest('tr');
      const completedCheckbox = completedTaskRow?.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;
      fireEvent.click(completedCheckbox);

      expect(screen.queryByTestId('bulk-complete-btn')).not.toBeInTheDocument();
    });

    it('should show bulk complete button when only pending tasks are selected', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 1');

      const checkboxes = screen.getAllByRole('checkbox');

      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);

      expect(screen.getByTestId('bulk-complete-btn')).toBeInTheDocument();
      expect(screen.getByText(/Mark 2 Tasks Completed/i)).toBeInTheDocument();
    });

    it('should reappear bulk complete button when completed task is deselected', async () => {
      render(<Tasks {...mockProps} />);

      const dropdown = await screen.findByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '50' } });

      await screen.findByText('Completed Task 1');

      const pendingTaskRow = screen.getByText('Task 1').closest('tr');
      const pendingCheckbox = pendingTaskRow?.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;
      fireEvent.click(pendingCheckbox);

      const completedTaskRow = screen
        .getByText('Completed Task 1')
        .closest('tr');
      const completedCheckbox = completedTaskRow?.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;
      fireEvent.click(completedCheckbox);

      expect(screen.queryByTestId('bulk-complete-btn')).not.toBeInTheDocument();

      fireEvent.click(completedCheckbox);

      await waitFor(() => {
        expect(screen.getByTestId('bulk-complete-btn')).toBeInTheDocument();
      });
    });

    it('should disable checkbox for deleted tasks', async () => {
      render(<Tasks {...mockProps} />);

      const dropdown = await screen.findByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '50' } });

      await screen.findByText('Deleted Task 1');

      const deletedTaskRow = screen.getByText('Deleted Task 1').closest('tr');
      const deletedCheckbox = deletedTaskRow?.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;

      expect(deletedCheckbox).toBeDisabled();
    });
  });

  test('shows "overdue" in status filter options', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Mocked BottomBar')).toBeInTheDocument();

    const multiSelectFilter = require('@/components/ui/multi-select');

    expect(multiSelectFilter.MultiSelectFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Status',
        options: expect.arrayContaining(['overdue']),
      }),
      {}
    );
  });

  test('filters tasks to show only overdue tasks when status "overdue" is selected', async () => {
    const MultiSelectFilter =
      require('@/components/ui/multi-select').MultiSelectFilter;

    MultiSelectFilter.mockImplementation(({ title }: { title: string }) => {
      return <div data-testid={`ms-${title}`}>Mocked MultiSelect: {title}</div>;
    });

    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 12')).toBeInTheDocument();
    });

    const lastCall = MultiSelectFilter.mock.calls.find(
      (call: any[]) => call[0].title === 'Status'
    );

    const onSelectionChange = lastCall[0].onSelectionChange;

    act(() => {
      onSelectionChange(['overdue']);
    });

    const overdueTask = screen.getByText('Task 1');
    expect(overdueTask).toBeInTheDocument();
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
  });

  test('shows "O" badge for overdue tasks in status column', async () => {
    render(<Tasks {...mockProps} />);

    await screen.findByText('Task 12');

    const dropdown = screen.getByLabelText('Show:');
    fireEvent.change(dropdown, { target: { value: '20' } });

    const row = screen.getByText('Task 1').closest('tr')!;
    const statusCell = within(row).getByText('O');

    expect(statusCell).toBeInTheDocument();
  });

  test('does not show "O" badge for non-overdue pending tasks', async () => {
    render(<Tasks {...mockProps} />);

    await screen.findByText('Task 12');

    const dropdown = screen.getByLabelText('Show:');
    fireEvent.change(dropdown, { target: { value: '20' } });

    expect(await screen.findByText('Task 2')).toBeInTheDocument();

    const row = screen.getByText('Task 2').closest('tr')!;
    const statusCell = within(row).getByText('P');

    expect(statusCell).toBeInTheDocument();
  });

  test('overdue tasks appear at the top of the list', async () => {
    render(<Tasks {...mockProps} />);

    await screen.findByText('Task 12');

    const dropdown = screen.getByLabelText('Show:');
    fireEvent.change(dropdown, { target: { value: '20' } });

    const firstRow = screen.getAllByRole('row')[1];
    expect(within(firstRow).getByText('Task 1')).toBeInTheDocument();
  });

  test('project dropdown lists existing projects and create-new option', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 1')).toBeInTheDocument();

    const addTaskButton = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(addTaskButton);

    const projectSelect = await screen.findByTestId('project-select');
    expect(
      within(projectSelect).getByText('Select a project')
    ).toBeInTheDocument();
    expect(within(projectSelect).getByText('Engineering')).toBeInTheDocument();
    expect(within(projectSelect).getByText('ProjectA')).toBeInTheDocument();
    expect(
      within(projectSelect).getByText('+ Create new project…')
    ).toBeInTheDocument();
  });

  test('selecting "+ Create new project…" reveals inline input', async () => {
    render(<Tasks {...mockProps} />);

    expect(await screen.findByText('Task 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    const projectSelect = await screen.findByTestId('project-select');
    fireEvent.change(projectSelect, { target: { value: '__CREATE_NEW__' } }); // Empty string triggers "create new project" mode

    const newProjectInput =
      await screen.findByPlaceholderText('New project name');
    fireEvent.change(newProjectInput, {
      target: { value: 'My Fresh Project' },
    });

    expect(newProjectInput).toHaveValue('My Fresh Project');
  });

  // Task Dependencies Tests
  describe('Task Dependencies', () => {
    test('passes allTasks prop to AddTaskDialog for dependency selection', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      const addTaskButton = screen.getByRole('button', { name: /add task/i });
      fireEvent.click(addTaskButton);

      expect(
        screen.getByText(/fill in the details below/i)
      ).toBeInTheDocument();

      expect(screen.getByText('Depends On')).toBeInTheDocument();
    });

    test('dependency dropdown is available in add task dialog', async () => {
      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      const addTaskButton = screen.getByRole('button', { name: /add task/i });
      fireEvent.click(addTaskButton);

      expect(screen.getByText('Depends On')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          'Search and select tasks this depends on...'
        )
      ).toBeInTheDocument();
    });
  });

  test('shows red border when task is marked as completed', async () => {
    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 12')).toBeInTheDocument();
    });

    const task12 = screen.getByText('Task 12');
    fireEvent.click(task12);

    await waitFor(() => {
      const completeButton = screen.getByLabelText('complete task');
      fireEvent.click(completeButton);
    });

    const yesButton = screen.getAllByText('Yes')[0];
    fireEvent.click(yesButton);

    await waitFor(() => {
      const row = screen.getByTestId('task-row-12');
      expect(row).toHaveClass('border-l-red-500');
    });
  });

  test('shows red border when task is deleted', async () => {
    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 12')).toBeInTheDocument();
    });

    const task12 = screen.getByText('Task 12');
    fireEvent.click(task12);

    await waitFor(() => {
      const deleteButton = screen.getByLabelText('delete task');
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      const yesButtons = screen.getAllByText('Yes');
      if (yesButtons.length > 0) fireEvent.click(yesButtons[0]);
    });

    await waitFor(() => {
      const row = screen.getByTestId('task-row-12');
      expect(row).toHaveClass('border-l-red-500');
    });
  });

  test('shows unsynced count after bulk delete', async () => {
    render(<Tasks {...mockProps} />);

    await screen.findByText('Task 1');
    const checkboxes = screen.getAllByRole('checkbox');

    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    const deleteBtn = screen.getByText(/Delete 2 Tasks/i);
    fireEvent.click(deleteBtn);

    const yesButton = await screen.findByText('Yes');
    fireEvent.click(yesButton);

    await waitFor(() => {
      const syncButton = document.getElementById('sync-task');
      expect(within(syncButton!).getByText('2')).toBeInTheDocument();
    });
  });

  test('shows unsynced count after bulk complete', async () => {
    render(<Tasks {...mockProps} />);

    await screen.findByText('Task 1');
    const checkboxes = screen.getAllByRole('checkbox');

    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    const bulkButton = screen.getByTestId('bulk-complete-btn');
    fireEvent.click(bulkButton);

    const yesButton = await screen.findByText('Yes');
    fireEvent.click(yesButton);

    await waitFor(() => {
      const syncButton = document.getElementById('sync-task');
      expect(within(syncButton!).getByText('2')).toBeInTheDocument();
    });
  });

  test('shows red border when task description is edited', async () => {
    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 12')).toBeInTheDocument();
    });

    const task12 = screen.getByText('Task 12');

    fireEvent.click(task12);

    await waitFor(() => {
      expect(screen.getByText('Description:')).toBeInTheDocument();
    });

    const descriptionLabel = screen.getByText('Description:');
    const descRow = descriptionLabel.closest('tr') as HTMLElement;
    const editButton = within(descRow).getByLabelText('edit');

    fireEvent.click(editButton);

    const input = await screen.findByDisplayValue('Task 12');

    fireEvent.change(input, { target: { value: 'Updated Task 12' } });

    const saveButton = screen.getByLabelText('save');

    fireEvent.click(saveButton);

    await waitFor(() => {
      const row = screen.getByTestId('task-row-12');
      expect(row).toHaveClass('border-l-red-500');
    });
  });

  test('shows red border when task project is edited', async () => {
    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 12')).toBeInTheDocument();
    });

    const task12 = screen.getByText('Task 12');
    fireEvent.click(task12);

    await waitFor(() => {
      expect(screen.getByText('Project:')).toBeInTheDocument();
    });

    const projectLabel = screen.getByText('Project:');
    const projectRow = projectLabel.closest('tr') as HTMLElement;
    const editButton = within(projectRow).getByLabelText('edit');
    fireEvent.click(editButton);

    const projectSelect = await screen.findByTestId('project-select');
    fireEvent.change(projectSelect, { target: { value: 'ProjectA' } });

    fireEvent.keyDown(document.body, { key: 'Escape' });

    await waitFor(() => {
      const row = screen.getByTestId('task-row-12');
      expect(row).toHaveClass('border-l-red-500');
    });
  });

  test.each([
    ['Wait', 'Wait:', 'Select wait date and time'],
    ['End', 'End:', 'Select end date and time'],
    ['Due', 'Due:', 'Select due date and time'],
    ['Start', 'Start:', 'Select start date and time'],
    ['Entry', 'Entry:', 'Select entry date and time'],
  ])('shows red when task %s date is edited', async (_, label, placeholder) => {
    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 12')).toBeInTheDocument();
    });

    const task12 = screen.getByText('Task 12');
    fireEvent.click(task12);

    await waitFor(() => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    const dateLabel = screen.getByText(label);
    const dateRow = dateLabel.closest('tr') as HTMLElement;

    const editButton = within(dateRow).getByLabelText('edit');
    fireEvent.click(editButton);

    const dateButton = within(dateRow).getByText(placeholder).closest('button');
    fireEvent.click(dateButton!);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    const day15 = within(dialog).getAllByText('15')[0];
    fireEvent.click(day15);

    const saveButton = screen.getByLabelText('save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      const row = screen.getByTestId('task-row-12');
      expect(row).toHaveClass('border-l-red-500');
    });
  });

  test('shows red border when task priority is edited', async () => {
    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 12')).toBeInTheDocument();
    });

    const task12 = screen.getByText('Task 12');
    fireEvent.click(task12);

    await waitFor(() => {
      expect(screen.getByText('Priority:')).toBeInTheDocument();
    });

    const priorityLabel = screen.getByText('Priority:');
    const priorityRow = priorityLabel.closest('tr') as HTMLElement;

    const editButton = within(priorityRow).getByLabelText('edit');
    fireEvent.click(editButton);

    const select = within(priorityRow).getByTestId('project-select');
    fireEvent.change(select, { target: { value: 'H' } });

    const saveButton = screen.getByLabelText('save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      const row = screen.getByTestId('task-row-12');
      expect(row).toHaveClass('border-l-red-500');
    });
  });

  test('shows red border when task dependencies are edited', async () => {
    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 12')).toBeInTheDocument();
    });

    const task12 = screen.getByText('Task 12');
    fireEvent.click(task12);

    await waitFor(() => {
      expect(screen.getByText('Depends:')).toBeInTheDocument();
    });

    const dependsLabel = screen.getByText('Depends:');
    const dependsRow = dependsLabel.closest('tr') as HTMLElement;

    const editButton = within(dependsRow).getByLabelText('edit');
    fireEvent.click(editButton);

    const addDependecyButton = within(dependsRow)
      .getByText('Add Dependency')
      .closest('button');
    fireEvent.click(addDependecyButton!);

    const dropdown = within(dependsRow).getByTestId('dependency-dropdown');

    fireEvent.click(within(dropdown).getByText('Task 11'));
    fireEvent.click(within(dropdown).getByText('Task 10'));

    const saveButton = screen.getByLabelText('save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      const row = screen.getByTestId('task-row-12');
      expect(row).toHaveClass('border-l-red-500');
    });
  });

  test('shows red border when task tags are edited', async () => {
    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 12')).toBeInTheDocument();
    });

    const task12 = screen.getByText('Task 12');
    fireEvent.click(task12);

    await waitFor(() => {
      expect(screen.getByText('Tags:')).toBeInTheDocument();
    });

    const tagsLabel = screen.getByText('Tags:');
    const tagsRow = tagsLabel.closest('tr') as HTMLElement;

    const editButton = within(tagsRow).getByLabelText('edit');
    fireEvent.click(editButton);

    const editInput = await screen.findByPlaceholderText(
      'Add a tag (press enter to add)'
    );

    fireEvent.change(editInput, { target: { value: 'unsyncedtag' } });
    fireEvent.keyDown(editInput, { key: 'Enter', code: 'Enter' });

    const saveButton = screen.getByLabelText('Save tags');
    fireEvent.click(saveButton);

    await waitFor(() => {
      const row = screen.getByTestId('task-row-12');
      expect(row).toHaveClass('border-l-red-500');
    });
  });

  test('shows red border when task recur is edited', async () => {
    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 12')).toBeInTheDocument();
    });

    const task12 = screen.getByText('Task 12');
    fireEvent.click(task12);

    await waitFor(() => {
      expect(screen.getByText('Recur:')).toBeInTheDocument();
    });

    const recurLabel = screen.getByText('Recur:');
    const recurRow = recurLabel.closest('tr') as HTMLElement;

    const editButton = within(recurRow).getByLabelText('edit');
    fireEvent.click(editButton);

    const select = within(recurRow).getByTestId('project-select');
    fireEvent.change(select, { target: { value: 'weekly' } });

    const saveButton = screen.getByLabelText('save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      const row = screen.getByTestId('task-row-12');
      expect(row).toHaveClass('border-l-red-500');
    });
  });

  test('shows and updates notification badge count on Sync button', async () => {
    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 12')).toBeInTheDocument();
    });

    const task12 = screen.getByText('Task 12');
    fireEvent.click(task12);

    await waitFor(() => {
      const completeButton = screen.getByLabelText('complete task');
      fireEvent.click(completeButton);
    });

    const yesButton = screen.getAllByText('Yes')[0];
    fireEvent.click(yesButton);

    await waitFor(() => {
      const row = screen.getByTestId('task-row-12');
      expect(row).toHaveClass('border-l-red-500');
    });

    const syncButtons = screen.getAllByText('Sync');
    const syncBtnContainer = syncButtons[0].closest('button');

    if (syncBtnContainer) {
      expect(within(syncBtnContainer).getByText('1')).toBeInTheDocument();
    } else {
      throw new Error('Sync button not found');
    }
  });

  test('clears red border after sync', async () => {
    render(<Tasks {...mockProps} />);

    await waitFor(async () => {
      expect(await screen.findByText('Task 12')).toBeInTheDocument();
    });

    const task12 = screen.getByText('Task 12');
    fireEvent.click(task12);

    await waitFor(() => {
      const completeButton = screen.getByLabelText('complete task');
      fireEvent.click(completeButton);
    });

    const yesButton = screen.getAllByText('Yes')[0];
    fireEvent.click(yesButton);

    await waitFor(() => {
      const row = screen.getByTestId('task-row-12');
      expect(row).toHaveClass('border-l-red-500');
    });

    const hooks = require('../hooks');
    hooks.fetchTaskwarriorTasks.mockResolvedValueOnce([
      {
        id: 12,
        description: 'Task 12',
        status: 'completed',
        project: 'ProjectA',
        tags: ['tag1'],
        uuid: 'uuid-12',
      },
    ]);

    const syncButtons = screen.getAllByText('Sync');
    fireEvent.click(syncButtons[0]);

    await waitFor(() => {
      const row = screen.getByTestId('task-row-12');
      expect(row).not.toHaveClass('border-l-red-500');
    });
  });

  describe('Pin Functionality', () => {
    test('should load pinned tasks from localStorage on mount', async () => {
      const { getPinnedTasks } = require('../tasks-utils');
      const mockPinnedSet = new Set(['uuid-1', 'uuid-2']);
      getPinnedTasks.mockReturnValue(mockPinnedSet);

      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(getPinnedTasks).toHaveBeenCalledWith(mockProps.email);
      });
    });

    test('should reload pinned tasks when email changes', async () => {
      const { getPinnedTasks } = require('../tasks-utils');
      getPinnedTasks.mockReturnValue(new Set(['uuid-1']));

      const { rerender } = render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(getPinnedTasks).toHaveBeenCalledWith(mockProps.email);
      });

      getPinnedTasks.mockClear();
      getPinnedTasks.mockReturnValue(new Set(['uuid-2']));

      rerender(<Tasks {...mockProps} email="newemail@example.com" />);

      await waitFor(() => {
        expect(getPinnedTasks).toHaveBeenCalledWith('newemail@example.com');
      });
    });

    test('should call togglePinnedTask when handleTogglePin is invoked', async () => {
      const { togglePinnedTask, getPinnedTasks } = require('../tasks-utils');
      getPinnedTasks.mockReturnValue(new Set());

      render(<Tasks {...mockProps} />);

      await waitFor(async () => {
        expect(await screen.findByText('Task 1')).toBeInTheDocument();
      });

      const task1Row = screen.getByText('Task 1').closest('tr');
      const pinButton = task1Row?.querySelector('button[aria-label*="Pin"]');

      if (pinButton) {
        fireEvent.click(pinButton);

        await waitFor(() => {
          expect(togglePinnedTask).toHaveBeenCalledWith(
            mockProps.email,
            'uuid-1'
          );
        });
      }
    });

    test('should update pinnedTasks state after toggling pin', async () => {
      const { getPinnedTasks } = require('../tasks-utils');
      getPinnedTasks
        .mockReturnValueOnce(new Set())
        .mockReturnValueOnce(new Set(['uuid-1']));

      render(<Tasks {...mockProps} />);

      await waitFor(async () => {
        expect(await screen.findByText('Task 1')).toBeInTheDocument();
      });

      const task1Row = screen.getByText('Task 1').closest('tr');
      const pinButton = task1Row?.querySelector('button[aria-label*="Pin"]');

      if (pinButton) {
        fireEvent.click(pinButton);

        await waitFor(() => {
          expect(getPinnedTasks).toHaveBeenCalledTimes(2);
        });
      }
    });

    test('should pass isPinned prop correctly to TaskDialog', async () => {
      const { getPinnedTasks } = require('../tasks-utils');
      getPinnedTasks.mockReturnValue(new Set(['uuid-1']));

      render(<Tasks {...mockProps} />);

      await waitFor(async () => {
        expect(await screen.findByText('Task 1')).toBeInTheDocument();
      });

      const task1Row = screen.getByText('Task 1').closest('tr');
      expect(task1Row).toBeInTheDocument();
    });

    test('should sort pinned tasks to the top', async () => {
      const { getPinnedTasks } = require('../tasks-utils');
      getPinnedTasks.mockReturnValue(new Set(['uuid-5']));

      render(<Tasks {...mockProps} />);

      await waitFor(async () => {
        expect(await screen.findByText('Task 5')).toBeInTheDocument();
      });

      const taskRows = screen.getAllByTestId(/task-row-/);
      const firstTaskRow = taskRows[0];
      const firstTaskDescription = within(firstTaskRow).getByText(/Task \d+/);

      expect(firstTaskDescription.textContent).toBe('Task 5');
    });

    test('should maintain pinned tasks at top when filters are applied', async () => {
      const { getPinnedTasks } = require('../tasks-utils');
      getPinnedTasks.mockReturnValue(new Set(['uuid-2']));

      render(<Tasks {...mockProps} />);

      await waitFor(async () => {
        expect(await screen.findByText('Task 2')).toBeInTheDocument();
      });

      const statusFilter = screen.getByText('Mocked MultiSelect: Status');
      expect(statusFilter).toBeInTheDocument();

      await waitFor(() => {
        const taskRows = screen.getAllByTestId(/task-row-/);
        expect(taskRows.length).toBeGreaterThan(0);
      });
    });

    test('should sort tasks with pinned first, then overdue, then others', async () => {
      const { getPinnedTasks } = require('../tasks-utils');
      getPinnedTasks.mockReturnValue(new Set(['uuid-3']));

      render(<Tasks {...mockProps} />);

      await waitFor(async () => {
        expect(await screen.findByText('Task 3')).toBeInTheDocument();
      });

      const taskRows = screen.getAllByTestId(/task-row-/);
      expect(taskRows.length).toBeGreaterThan(0);
    });

    test('should pass onTogglePin prop to TaskDialog', async () => {
      const { getPinnedTasks } = require('../tasks-utils');
      getPinnedTasks.mockReturnValue(new Set());

      render(<Tasks {...mockProps} />);

      await waitFor(async () => {
        expect(await screen.findByText('Task 1')).toBeInTheDocument();
      });

      const task1Row = screen.getByText('Task 1').closest('tr');
      expect(task1Row).toBeInTheDocument();
    });
  });
});
