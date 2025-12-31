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
  };
});

jest.mock('@/components/ui/multi-select', () => ({
  MultiSelectFilter: jest.fn(({ id, title }) => (
    <div id={id}>Mocked MultiSelect: {title}</div>
  )),
}));

jest.mock('@/components/ui/select', () => {
  return {
    Select: ({ children, onValueChange, value }: any) => {
      let testId = '';
      const React = require('react');
      React.Children.forEach(children, (child: any) => {
        if (child?.props?.['data-testid']) {
          testId = child.props['data-testid'];
        }
      });

      return (
        <select
          data-testid={testId}
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
              depends: i === 9 ? ['uuid-corp-1'] : undefined,
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

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

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

  describe('Add Task', () => {
    test('successfully adds a task via dialog', async () => {
      const hooks = require('../hooks');

      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');

      fireEvent.click(screen.getByRole('button', { name: /add task/i }));

      const descInput = await screen.findByLabelText('Description');
      fireEvent.change(descInput, {
        target: { value: 'New Task Description' },
      });

      const dialog = screen.getByRole('dialog');
      const addButton = within(dialog).getByRole('button', {
        name: /add task/i,
      });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(hooks.addTaskToBackend).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'New Task Description',
          })
        );
      });
    });

    test('closes dialog after successful task add', async () => {
      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');

      fireEvent.click(screen.getByRole('button', { name: /add task/i }));

      const descInput = await screen.findByLabelText('Description');
      fireEvent.change(descInput, { target: { value: 'Another Task' } });

      const dialog = screen.getByRole('dialog');
      const addButton = within(dialog).getByRole('button', {
        name: /add task/i,
      });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText('Description')
        ).not.toBeInTheDocument();
      });
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

  describe('Tag', () => {
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

      expect(screen.queryByText('tag1')).not.toBeInTheDocument();

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

  describe('Overdue Tasks', () => {
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
  });

  describe('Search and Filtering', () => {
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
        return (
          <div data-testid={`ms-${title}`}>Mocked MultiSelect: {title}</div>
        );
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

    test('filtering by tag shows only tasks with that tag', async () => {
      const MultiSelectFilter =
        require('@/components/ui/multi-select').MultiSelectFilter;

      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');

      const tagsCall = MultiSelectFilter.mock.calls.find(
        (call: any[]) => call[0].title === 'Tags'
      );

      act(() => {
        tagsCall[0].onSelectionChange(['tag1']);
      });

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
    });

    test('filtering by project shows only tasks with that project', async () => {
      const MultiSelectFilter =
        require('@/components/ui/multi-select').MultiSelectFilter;
      render(<Tasks {...mockProps} />);

      const dropdown = await screen.findByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '50' } });

      await screen.findByText('Engineering');

      const projectsCall = MultiSelectFilter.mock.calls.find(
        (call: any[]) => call[0].title === 'Projects'
      );

      act(() => {
        projectsCall[0].onSelectionChange(['Engineering']);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Draft technical documentation/i)
        ).toBeInTheDocument();
      });

      expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
    });

    test('filtering by multiple statuses shows matching tasks', async () => {
      const MultiSelectFilter =
        require('@/components/ui/multi-select').MultiSelectFilter;
      render(<Tasks {...mockProps} />);

      const dropdown = await screen.findByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '50' } });

      await screen.findByText('Completed Task 1');
      const statusCall = MultiSelectFilter.mock.calls.find(
        (call: any[]) => call[0].title === 'Status'
      );

      act(() => {
        statusCall[0].onSelectionChange(['pending', 'completed']);
      });

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
        expect(screen.getByText('Completed Task 1')).toBeInTheDocument();
      });

      expect(screen.queryByText('Deleted Task 1')).not.toBeInTheDocument();
    });

    test('applying multiple filters narrows down results', async () => {
      const MultiSelectFilter =
        require('@/components/ui/multi-select').MultiSelectFilter;
      render(<Tasks {...mockProps} />);

      const dropdown = await screen.findByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '50' } });

      await screen.findByText('Task 1');

      const projectsCall = MultiSelectFilter.mock.calls.find(
        (call: any[]) => call[0].title === 'Projects'
      );
      const statusCall = MultiSelectFilter.mock.calls.find(
        (call: any[]) => call[0].title === 'Status'
      );

      act(() => {
        projectsCall[0].onSelectionChange(['ProjectA']);
      });

      act(() => {
        statusCall[0].onSelectionChange(['pending']);
      });

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    test('clicking ID header toggles sort order', async () => {
      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Deleted Task 1')).toBeInTheDocument();
      expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
      const idHeader = screen.getByText('ID');
      fireEvent.click(idHeader);

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.queryByText('Deleted Task 1')).not.toBeInTheDocument();
    });

    test('clicking Status header toggles status sort order', async () => {
      render(<Tasks {...mockProps} />);
      await screen.findByText('Completed Task 1');

      const statusHeader = screen.getByText('Status');
      fireEvent.click(statusHeader);

      expect(screen.getByTestId('current-page')).toHaveTextContent('1');
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
  });

  describe('Add Task Dialog', () => {
    test('project dropdown lists existing projects and create-new option', async () => {
      render(<Tasks {...mockProps} />);

      expect(await screen.findByText('Task 1')).toBeInTheDocument();

      const addTaskButton = screen.getByRole('button', { name: /add task/i });
      fireEvent.click(addTaskButton);

      const projectSelect = await screen.findByTestId('project-select');
      expect(
        within(projectSelect).getByText('Select a project')
      ).toBeInTheDocument();
      expect(
        within(projectSelect).getByText('Engineering')
      ).toBeInTheDocument();
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
  });

  describe('Task Dialog', () => {
    test('clicking task row opens dialog and closing resets state', async () => {
      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');

      fireEvent.click(screen.getByText('Task 1'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dialog Task Selection', () => {
    test('opening dialog with task sets selectedTask', async () => {
      render(<Tasks {...mockProps} />);

      const dropdown = await screen.findByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '50' } });

      await screen.findByText('Engineering');

      fireEvent.click(screen.getByText(/Draft technical documentation/i));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');

        expect(within(dialog).getByText('Engineering')).toBeInTheDocument();
        expect(within(dialog).getByText('documentation')).toBeInTheDocument();
        expect(within(dialog).getByText('api')).toBeInTheDocument();
      });
    });

    test('clicking different tasks shows their data', async () => {
      render(<Tasks {...mockProps} />);

      const dropdown = await screen.findByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '50' } });

      await screen.findByText('Task 1');

      fireEvent.click(screen.getByText('Task 1'));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('tag1')).toBeInTheDocument();
        expect(within(dialog).getByText('ProjectA')).toBeInTheDocument();
      });

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Task 4'));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('ProjectB')).toBeInTheDocument();
      });
    });
  });

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

    test('shows error when trying to complete task with incomplete dependencies', async () => {
      const { toast } = require('react-toastify');

      render(<Tasks {...mockProps} />);

      const dropdown = await screen.findByLabelText('Show:');
      fireEvent.change(dropdown, { target: { value: '50' } });

      await screen.findByText('Task 10');
      fireEvent.click(screen.getByText('Task 10'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const completeBtn = screen.getByLabelText('complete task');
      fireEvent.click(completeBtn);

      const yesBtn = await screen.findByText('Yes');
      fireEvent.click(yesBtn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Cannot complete this task')
        );
      });
    });
  });

  describe('Unsync', () => {
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
      ['Wait', 'Wait:', 'Pick a date'],
      ['End', 'End:', 'Select end date and time'],
      ['Due', 'Due:', 'Select due date and time'],
      ['Start', 'Start:', 'Select start date and time'],
      ['Entry', 'Entry:', 'Pick a date'],
    ])(
      'shows red when task %s date is edited',
      async (_, label, placeholder) => {
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

        const dateButton = within(dateRow)
          .getByText(placeholder)
          .closest('button');
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
      }
    );

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

      const select = within(priorityRow).getByTestId('priority-select');
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

      const select = within(recurRow).getByTestId('recur-select');
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
  });

  describe('Sync Button', () => {
    test('clicking sync button triggers loading and sync', async () => {
      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');

      const syncBtn = document.getElementById('sync-task');
      expect(syncBtn).toBeInTheDocument();

      fireEvent.click(syncBtn!);

      expect(mockProps.setIsLoading).toHaveBeenCalledWith(true);
    });

    test('shows error toast when sync fails', async () => {
      const { toast } = require('react-toastify');
      const hooks = require('../hooks');

      hooks.fetchTaskwarriorTasks.mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');

      const syncBtn = document.getElementById('sync-task');
      fireEvent.click(syncBtn!);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to sync')
        );
      });
    });
  });

  describe('Keyboard Navigation', () => {
    describe('Arrow Key Navigation', () => {
      test('ArrowDown key moves selection to next task', async () => {
        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        fireEvent.keyDown(window, { key: 'ArrowDown' });
        fireEvent.keyDown(window, { key: 'e' });

        await waitFor(() => {
          const dialog = screen.getByRole('dialog');
          expect(
            within(dialog).getByText('Deleted Task 1')
          ).toBeInTheDocument();
        });
      });

      test('ArrowUp moves selection back to previous task', async () => {
        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        fireEvent.keyDown(window, { key: 'ArrowDown' });
        fireEvent.keyDown(window, { key: 'ArrowDown' });
        fireEvent.keyDown(window, { key: 'ArrowUp' });
        fireEvent.keyDown(window, { key: 'e' });

        await waitFor(() => {
          const dialog = screen.getByRole('dialog');
          expect(
            within(dialog).getByText('Deleted Task 1')
          ).toBeInTheDocument();
        });
      });

      test('ArrowDown stops at last task on page', async () => {
        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        for (let i = 0; i < 20; i++) {
          fireEvent.keyDown(window, { key: 'ArrowDown' });
        }

        fireEvent.keyDown(window, { key: 'e' });

        await waitFor(() => {
          const dialog = screen.getByRole('dialog');
          expect(within(dialog).getByText('Task 9')).toBeInTheDocument();
        });
      });

      test('ArrowUp stops at index 0 (Task 1)', async () => {
        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        for (let i = 0; i < 5; i++) {
          fireEvent.keyDown(window, { key: 'ArrowUp' });
        }

        fireEvent.keyDown(window, { key: 'e' });

        await waitFor(() => {
          const dialog = screen.getByRole('dialog');
          expect(within(dialog).getByText('tag1')).toBeInTheDocument();
          expect(within(dialog).getByText('Overdue')).toBeInTheDocument();
        });
      });
    });

    describe('Hotkey Shortcuts', () => {
      test('pressing "a" opens the Add Task dialog', async () => {
        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        fireEvent.keyDown(window, { key: 'a' });

        await waitFor(() => {
          expect(
            screen.getByText(/fill in the details below to add a new task/i)
          ).toBeInTheDocument();
        });
      });

      test('pressing "c" attempts to open task dialog and trigger complete', async () => {
        jest.useFakeTimers();

        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        fireEvent.keyDown(window, { key: 'c' });

        await waitFor(() => {
          expect(screen.getByText('Tags:')).toBeInTheDocument();
        });

        act(() => {
          jest.advanceTimersByTime(200);
        });

        await waitFor(() => {
          expect(screen.getByText('Are you')).toBeInTheDocument();
        });

        jest.useRealTimers();
      });

      test('pressing "d" attempts to open task dialog and trigger delete', async () => {
        jest.useFakeTimers();

        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        fireEvent.keyDown(window, { key: 'd' });

        await waitFor(() => {
          expect(screen.getByText('Tags:')).toBeInTheDocument();
        });

        act(() => {
          jest.advanceTimersByTime(200);
        });

        await waitFor(() => {
          expect(screen.getByText('Are you')).toBeInTheDocument();
        });

        jest.useRealTimers();
      });

      test('pressing "e" key opens the selected task dialog', async () => {
        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        fireEvent.keyDown(window, { key: 'e' });

        expect(await screen.findByText('Tags:')).toBeInTheDocument();
      });

      test('pressing "f" focuses the search input', async () => {
        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        fireEvent.keyDown(window, { key: 'f' });

        const searchInput = screen.getByPlaceholderText('Search tasks...');
        expect(document.activeElement).toBe(searchInput);
      });

      test('pressing "r" triggers sync', async () => {
        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        fireEvent.keyDown(window, { key: 'r' });

        expect(mockProps.setIsLoading).toHaveBeenCalledWith(true);
      });

      test('pressing "p" key clicks the projects filter element', async () => {
        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        const getElementSpy = jest.spyOn(document, 'getElementById');

        fireEvent.keyDown(window, { key: 'p' });

        expect(getElementSpy).toHaveBeenCalledWith('projects');
        getElementSpy.mockRestore();
      });

      test('pressing "s" key clicks the status filter element', async () => {
        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        const getElementSpy = jest.spyOn(document, 'getElementById');

        fireEvent.keyDown(window, { key: 's' });

        expect(getElementSpy).toHaveBeenCalledWith('status');
        getElementSpy.mockRestore();
      });

      test('pressing "t" key clicks the tags filter element', async () => {
        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        const getElementSpy = jest.spyOn(document, 'getElementById');
        fireEvent.keyDown(window, { key: 't' });

        expect(getElementSpy).toHaveBeenCalledWith('tags');
        getElementSpy.mockRestore();
      });

      test('hotkeys are disabled when input is focused', async () => {
        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        const searchInput = screen.getByPlaceholderText('Search tasks...');
        searchInput.focus();

        fireEvent.keyDown(searchInput, { key: 'r' });

        expect(mockProps.setIsLoading).not.toHaveBeenCalledWith(true);
      });
    });

    describe('Complete Hotkey When Dialog Open', () => {
      test('pressing "c" when dialog is already open triggers complete button', async () => {
        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        fireEvent.click(screen.getByText('Task 1'));

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        const getElementSpy = jest.spyOn(document, 'getElementById');
        fireEvent.keyDown(window, { key: 'c' });

        expect(getElementSpy).toHaveBeenCalledWith('mark-task-complete-1');

        getElementSpy.mockRestore();
      });

      test('pressing "d" when dialog is already open triggers delete button', async () => {
        render(<Tasks {...mockProps} />);
        await screen.findByText('Task 1');

        fireEvent.click(screen.getByText('Task 1'));

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        const getElementSpy = jest.spyOn(document, 'getElementById');
        fireEvent.keyDown(window, { key: 'd' });

        expect(getElementSpy).toHaveBeenCalledWith('mark-task-as-deleted-1');

        getElementSpy.mockRestore();
      });
    });
  });

  describe('Hotkeys Enable/Disable on Hover', () => {
    test('hotkeys work when mouse is over task table', async () => {
      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');

      const taskContainer = screen
        .getByText('Here are')
        .closest('div')?.parentElement;
      fireEvent.mouseEnter(taskContainer!);

      fireEvent.keyDown(window, { key: 'f' });
      const searchInput = screen.getByPlaceholderText('Search tasks...');
      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe('Annotations', () => {
    test('can add annotation to task and save', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 1');

      fireEvent.click(screen.getByText('Task 1'));

      await waitFor(() => {
        expect(screen.getByText('Annotations:')).toBeInTheDocument();
      });

      const annotationsLabel = screen.getByText('Annotations:');
      const annotationsRow = annotationsLabel.closest('tr') as HTMLElement;

      const editButton = within(annotationsRow).getByLabelText('edit');
      fireEvent.click(editButton);

      const input = await screen.findByPlaceholderText(
        'Add an annotation (press enter to add)'
      );
      fireEvent.change(input, { target: { value: 'My new annotation' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(screen.getByText('My new annotation')).toBeInTheDocument();

      const saveButton = screen.getByLabelText('Save annotations');

      fireEvent.click(saveButton);

      await waitFor(() => {
        const hooks = require('../hooks');
        expect(hooks.editTaskOnBackend).toHaveBeenCalled();
      });
    });

    test('can remove annotation and save', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 1');

      fireEvent.click(screen.getByText('Task 1'));

      await waitFor(() => {
        expect(screen.getByText('Annotations:')).toBeInTheDocument();
      });

      const annotationsLabel = screen.getByText('Annotations:');
      const annotationsRow = annotationsLabel.closest('tr') as HTMLElement;
      const editButton = within(annotationsRow).getByLabelText('edit');

      fireEvent.click(editButton);

      const input = await screen.findByPlaceholderText(
        'Add an annotation (press enter to add)'
      );

      fireEvent.change(input, { target: { value: 'Annotation to remove' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      const annotationBadge = screen.getByText('Annotation to remove');
      const badgeContainer = annotationBadge.closest('div') as HTMLElement;
      const removeBtn = within(badgeContainer).getByText('✖');

      fireEvent.click(removeBtn);

      expect(
        screen.queryByText('Annotation to remove')
      ).not.toBeInTheDocument();
    });
  });

  describe('Reports Toggle', () => {
    test('clicking "Show Reports" button switches view from tasks to reports', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 1');

      expect(screen.getByText('Here are')).toBeInTheDocument();

      const toggleBtn = screen.getByRole('button', { name: /show reports/i });
      fireEvent.click(toggleBtn);

      expect(
        screen.getByRole('button', { name: /show tasks/i })
      ).toBeInTheDocument();
    });

    test('clicking "Show Tasks" returns to task list view', async () => {
      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');

      fireEvent.click(screen.getByRole('button', { name: /show reports/i }));
      fireEvent.click(screen.getByRole('button', { name: /show tasks/i }));

      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    test('hotkeys are disabled when reports view is shown', async () => {
      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');

      fireEvent.click(screen.getByRole('button', { name: /show reports/i }));
      fireEvent.keyDown(window, { key: 'a' });

      expect(
        screen.queryByText(/fill in the details below/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Recur Editing', () => {
    test('does not save when recur is set to "none"', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 12');
      fireEvent.click(screen.getByText('Task 12'));

      await waitFor(() => {
        expect(screen.getByText('Recur:')).toBeInTheDocument();
      });

      const recurLabel = screen.getByText('Recur:');
      const recurRow = recurLabel.closest('tr') as HTMLElement;
      const editButton = within(recurRow).getByLabelText('edit');

      fireEvent.click(editButton);

      const select = within(recurRow).getByTestId('recur-select');
      fireEvent.change(select, { target: { value: 'none' } });

      const saveButton = screen.getByLabelText('save');
      fireEvent.click(saveButton);

      const hooks = require('../hooks');
      expect(hooks.editTaskOnBackend).not.toHaveBeenCalled();
    });

    test('saves recur when a valid value is selected', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 12');
      fireEvent.click(screen.getByText('Task 12'));

      await waitFor(() => {
        expect(screen.getByText('Recur:')).toBeInTheDocument();
      });

      const recurLabel = screen.getByText('Recur:');
      const recurRow = recurLabel.closest('tr') as HTMLElement;
      const editButton = within(recurRow).getByLabelText('edit');

      fireEvent.click(editButton);

      const select = within(recurRow).getByTestId('recur-select');
      fireEvent.change(select, { target: { value: 'daily' } });

      const saveButton = screen.getByLabelText('save');
      fireEvent.click(saveButton);

      const hooks = require('../hooks');
      expect(hooks.editTaskOnBackend).toHaveBeenCalled();
    });

    test('does not save when recur is empty string', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 12');
      fireEvent.click(screen.getByText('Task 12'));

      await waitFor(() => {
        expect(screen.getByText('Recur:')).toBeInTheDocument();
      });

      const recurLabel = screen.getByText('Recur:');
      const recurRow = recurLabel.closest('tr') as HTMLElement;
      const editButton = within(recurRow).getByLabelText('edit');
      fireEvent.click(editButton);

      const select = within(recurRow).getByTestId('recur-select');
      fireEvent.change(select, { target: { value: '' } });
      const saveButton = within(recurRow).getByLabelText('save');
      fireEvent.click(saveButton);

      const hooks = require('../hooks');
      expect(hooks.editTaskOnBackend).not.toHaveBeenCalled();
    });
  });

  describe('Priority Editing', () => {
    test('saving priority calls modifyTaskOnBackend with correct value', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 12');
      fireEvent.click(screen.getByText('Task 12'));

      await waitFor(() => {
        expect(screen.getByText('Priority:')).toBeInTheDocument();
      });

      const priorityLabel = screen.getByText('Priority:');
      const priorityRow = priorityLabel.closest('tr') as HTMLElement;
      const editButton = within(priorityRow).getByLabelText('edit');
      fireEvent.click(editButton);

      const select = within(priorityRow).getByTestId('priority-select');
      fireEvent.change(select, { target: { value: 'H' } });

      const saveButton = screen.getByLabelText('save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const hooks = require('../hooks');
        expect(hooks.modifyTaskOnBackend).toHaveBeenCalledWith(
          expect.objectContaining({ priority: 'H' })
        );
      });
    });

    test('saving "NONE" priority sends empty string to backend', async () => {
      render(<Tasks {...mockProps} />);

      await screen.findByText('Task 12');
      fireEvent.click(screen.getByText('Task 12'));

      await waitFor(() => {
        expect(screen.getByText('Priority:')).toBeInTheDocument();
      });

      const priorityLabel = screen.getByText('Priority:');
      const priorityRow = priorityLabel.closest('tr') as HTMLElement;
      const editButton = within(priorityRow).getByLabelText('edit');
      fireEvent.click(editButton);

      const select = within(priorityRow).getByTestId('priority-select');
      fireEvent.change(select, { target: { value: 'NONE' } });

      const saveButton = screen.getByLabelText('save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const hooks = require('../hooks');
        expect(hooks.modifyTaskOnBackend).toHaveBeenCalledWith(
          expect.objectContaining({
            priority: '',
          })
        );
      });
    });

    test('shows error toast when priority save fails', async () => {
      const { toast } = require('react-toastify');
      const hooks = require('../hooks');

      hooks.modifyTaskOnBackend.mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 12');

      fireEvent.click(screen.getByText('Task 12'));

      await waitFor(() => {
        expect(screen.getByText('Priority:')).toBeInTheDocument();
      });

      const priorityLabel = screen.getByText('Priority:');
      const priorityRow = priorityLabel.closest('tr') as HTMLElement;

      const editButton = within(priorityRow).getByLabelText('edit');
      fireEvent.click(editButton);

      const select = within(priorityRow).getByTestId('priority-select');
      fireEvent.change(select, { target: { value: 'H' } });

      const saveButton = within(priorityRow).getByLabelText('save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to update priority')
        );
      });
    });
  });

  describe('LocalStorage Persistence', () => {
    test('loads tasksPerPage from localStorage on mount', async () => {
      const hashedKey = require('../tasks-utils').hashKey(
        'tasksPerPage',
        'test@example.com'
      );
      localStorage.setItem(hashedKey, '20');

      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');

      const dropdown = screen.getByLabelText('Show:');
      expect(dropdown).toHaveValue('20');
    });

    test('loads lastSyncTime from localStorage on mount', async () => {
      const hashedKey = require('../tasks-utils').hashKey(
        'lastSyncTime',
        'test@example.com'
      );
      const mockTime = Date.now() - 60000;
      localStorage.setItem(hashedKey, mockTime.toString());

      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');

      expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
    });
  });

  describe('Sync Time Auto-Update', () => {
    test('last sync time display updates after interval fires', async () => {
      jest.useFakeTimers();

      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const hashedKey = require('../tasks-utils').hashKey(
        'lastSyncTime',
        'test@example.com'
      );
      localStorage.setItem(hashedKey, fiveMinutesAgo.toString());

      render(<Tasks {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      expect(screen.getByText(/Last updated/i)).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(screen.getByText(/Last updated/i)).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(screen.getByText(/Last updated/i)).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('Task Error Handling', () => {
    test('logs error when editing description fails', async () => {
      const hooks = require('../hooks');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      hooks.editTaskOnBackend.mockRejectedValueOnce(new Error('Network error'));

      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 12');

      fireEvent.click(screen.getByText('Task 12'));

      await waitFor(() => {
        expect(screen.getByText('Description:')).toBeInTheDocument();
      });

      const descLabel = screen.getByText('Description:');
      const descRow = descLabel.closest('tr') as HTMLElement;

      const editButton = within(descRow).getByLabelText('edit');
      fireEvent.click(editButton);

      const input = await screen.findByDisplayValue('Task 12');
      fireEvent.change(input, { target: { value: 'Updated Description' } });

      const saveButton = within(descRow).getByLabelText('save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to edit task:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
      hooks.editTaskOnBackend.mockResolvedValue({});
    });

    test('logs error when add task fails', async () => {
      const hooks = require('../hooks');
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      hooks.addTaskToBackend.mockRejectedValueOnce(new Error('Network error'));

      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');

      fireEvent.click(screen.getByRole('button', { name: /add task/i }));

      const descInput = await screen.findByLabelText('Description');
      fireEvent.change(descInput, { target: { value: 'New Task' } });

      const dialog = screen.getByRole('dialog');
      const addButton = within(dialog).getByRole('button', {
        name: /add task/i,
      });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to add task:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
      hooks.addTaskToBackend.mockResolvedValue({});
    });
  });

  describe('Mouse Hover Handlers', () => {
    test('mouseEnter and mouseLeave handlers execute without error', async () => {
      render(<Tasks {...mockProps} />);
      await screen.findByText('Task 1');

      const taskTable = screen.getByText('Here are').closest('h3')
        ?.parentElement?.parentElement?.parentElement;

      fireEvent.mouseEnter(taskTable!);
      fireEvent.mouseLeave(taskTable!);

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Search tasks...')
      ).toBeInTheDocument();
    });
  });
});
