import { render, screen, fireEvent, within } from '@testing-library/react';
import { Tasks } from '../../Tasks';
import { openTaskDialog, getRowAndClickEdit } from '../test-utils/helper';
import { createMockProps, mockTasks } from '../test-utils/setup';

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

describe('Annotation Editing', () => {
  const hooks = require('../../hooks');

  beforeEach(() => {
    jest.clearAllMocks();
    mockTasks.forEach((t: any) => {
      delete t.annotations;
    });
  });

  test('should add a new annotation and save to backend', async () => {
    render(<Tasks {...createMockProps()} />);
    await openTaskDialog('Task 12');

    const annotationRow = getRowAndClickEdit('Annotations:');
    const input = within(annotationRow).getByPlaceholderText(
      'Add an annotation (press enter to add)'
    );

    fireEvent.change(input, { target: { value: 'Important note' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    const saveButton = screen.getByLabelText('Save annotations');
    fireEvent.click(saveButton);

    expect(hooks.editTaskOnBackend).toHaveBeenCalledWith(
      expect.objectContaining({
        annotations: expect.arrayContaining([
          expect.objectContaining({ description: 'Important note' }),
        ]),
      })
    );
  });

  test('should remove an added annotation before saving', async () => {
    render(<Tasks {...createMockProps()} />);
    await openTaskDialog('Task 12');

    const annotationRow = getRowAndClickEdit('Annotations:');
    const input = within(annotationRow).getByPlaceholderText(
      'Add an annotation (press enter to add)'
    );

    fireEvent.change(input, { target: { value: 'Temporary note' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    const removeButton = within(annotationRow).getByText('✖');
    fireEvent.click(removeButton);

    const saveButton = screen.getByLabelText('Save annotations');
    fireEvent.click(saveButton);

    expect(hooks.editTaskOnBackend).toHaveBeenCalledWith(
      expect.objectContaining({
        annotations: [],
      })
    );
  });

  test('should not add an annotation when input is empty or whitespace', async () => {
    render(<Tasks {...createMockProps()} />);
    await openTaskDialog('Task 12');

    const annotationRow = getRowAndClickEdit('Annotations:');
    const input = within(annotationRow).getByPlaceholderText(
      'Add an annotation (press enter to add)'
    );

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(within(annotationRow).queryByText('✖')).toBeNull();

    const saveButton = screen.getByLabelText('Save annotations');
    fireEvent.click(saveButton);

    expect(hooks.editTaskOnBackend).toHaveBeenCalledWith(
      expect.objectContaining({
        annotations: [],
      })
    );
  });

  test('should cancel editing annotations without calling backend', async () => {
    render(<Tasks {...createMockProps()} />);
    await openTaskDialog('Task 12');

    const annotationRow = getRowAndClickEdit('Annotations:');
    const input = within(annotationRow).getByPlaceholderText(
      'Add an annotation (press enter to add)'
    );

    fireEvent.change(input, { target: { value: 'Discarded note' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    const cancelButton = screen.getByLabelText('Cancel editing annotations');
    fireEvent.click(cancelButton);

    expect(hooks.editTaskOnBackend).not.toHaveBeenCalled();
  });
});
