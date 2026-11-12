import { render, screen, fireEvent, within } from '@testing-library/react';
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

describe('Recur Editing', () => {
  const hooks = require('../../hooks');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should save selected recur value to backend', async () => {
    render(<Tasks {...createMockProps()} />);
    await openTaskDialog('Task 12');

    const recurRow = getRowAndClickEdit('Recur:');
    const select = within(recurRow).getByTestId('project-select');
    fireEvent.change(select, { target: { value: 'weekly' } });

    const saveButton = screen.getByLabelText('save');
    fireEvent.click(saveButton);

    expect(hooks.editTaskOnBackend).toHaveBeenCalledWith(
      expect.objectContaining({ recur: 'weekly' })
    );
  });

  test('should not call backend when none is selected', async () => {
    render(<Tasks {...createMockProps()} />);
    await openTaskDialog('Task 12');

    const recurRow = getRowAndClickEdit('Recur:');
    const select = within(recurRow).getByTestId('project-select');
    fireEvent.change(select, { target: { value: 'none' } });

    const saveButton = screen.getByLabelText('save');
    fireEvent.click(saveButton);

    expect(hooks.editTaskOnBackend).not.toHaveBeenCalled();
  });

  test('should cancel editing recur without calling backend', async () => {
    render(<Tasks {...createMockProps()} />);
    await openTaskDialog('Task 12');

    const recurRow = getRowAndClickEdit('Recur:');
    const select = within(recurRow).getByTestId('project-select');
    fireEvent.change(select, { target: { value: 'monthly' } });

    const cancelButton = screen.getByLabelText('cancel');
    fireEvent.click(cancelButton);

    expect(hooks.editTaskOnBackend).not.toHaveBeenCalled();
  });
});
