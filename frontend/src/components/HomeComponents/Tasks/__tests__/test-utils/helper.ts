import { screen, fireEvent, within } from '@testing-library/react';

export const openTaskDialog = async (taskDescription: string) => {
  await screen.findByText(taskDescription);
  fireEvent.click(screen.getByText(taskDescription));
  await screen.findByText('Description:');
};

export const getRowAndClickEdit = (fieldLabel: string) => {
  const row = screen.getByText(fieldLabel).closest('tr') as HTMLElement;
  const editButton = within(row).getByLabelText('edit');
  fireEvent.click(editButton);
  return row;
};
