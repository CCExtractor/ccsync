import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { Tasks } from '../../Tasks';
import { openTaskDialog, getRowAndClickEdit } from '../test-utils/helper';
import { createMockProps } from '../test-utils/setup';

jest.mock('react-toastify', () =>
  require('../test-utils/setup').createToastMock()
);
jest.mock('../../tasks-utils', () =>
  require('../test-utils/setup').createTasksUtilsMock()
);
jest.mock('../../hooks', () =>
  require('../test-utils/setup').createHooksMock()
);
jest.mock(
  '@/components/ui/select',
  () => require('../test-utils/setup').selectMock
);

describe('Priority Editing', () => {
  const { toast } = require('react-toastify');
  const hooks = require('../../hooks');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should save selected priority value to backend', async () => {
    render(<Tasks {...createMockProps()} />);
    await openTaskDialog('Task 12');

    const priorityRow = getRowAndClickEdit('Priority:');
    const select = within(priorityRow).getByTestId('project-select');
    fireEvent.change(select, { target: { value: 'H' } });

    const saveButton = screen.getByLabelText('save');
    fireEvent.click(saveButton);

    expect(hooks.modifyTaskOnBackend).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'H' })
    );
  });

  test('should send empty string when NONE priority is selected', async () => {
    render(<Tasks {...createMockProps()} />);
    await openTaskDialog('Task 12');
    const priorityRow = getRowAndClickEdit('Priority:');

    const select = within(priorityRow).getByTestId('project-select');
    fireEvent.change(select, { target: { value: 'NONE' } });

    const saveButton = screen.getByLabelText('save');
    fireEvent.click(saveButton);

    expect(hooks.modifyTaskOnBackend).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: '',
      })
    );
  });

  test('should show error toast when save fails', async () => {
    hooks.modifyTaskOnBackend.mockRejectedValueOnce(new Error('Network error'));

    render(<Tasks {...createMockProps()} />);
    await openTaskDialog('Task 12');
    const priorityRow = getRowAndClickEdit('Priority:');

    const select = within(priorityRow).getByTestId('project-select');
    fireEvent.change(select, { target: { value: 'H' } });

    const saveButton = screen.getByLabelText('save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update priority')
      );
    });
  });
});
