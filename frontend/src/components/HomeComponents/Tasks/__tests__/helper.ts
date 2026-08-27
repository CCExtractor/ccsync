import { screen, fireEvent } from '@testing-library/react';

export const enableHotkeysViaHover = () => {
  const taskContainer = screen.getByTestId('tasks-table-container');
  fireEvent.mouseEnter(taskContainer);
};
