import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateTimePicker } from '../date-time-picker';
import '@testing-library/jest-dom';

describe('DateTimePicker', () => {
  it('renders without crashing', () => {
    const mockOnDateTimeChange = jest.fn();
    render(
      <DateTimePicker
        date={undefined}
        onDateTimeChange={mockOnDateTimeChange}
      />
    );
    expect(
      screen.getByRole('button', { name: /calender-button/i })
    ).toBeInTheDocument();
  });

  it('opens and closes the popover when the trigger button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnDateTimeChange = jest.fn();
    render(
      <DateTimePicker
        date={undefined}
        onDateTimeChange={mockOnDateTimeChange}
      />
    );

    const triggerButton = screen.getByRole('button', {
      name: /calender-button/i,
    });

    // Open popover
    await user.click(triggerButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument(); // Popover content is a dialog
    expect(screen.getByText(/February 2026/)).toBeInTheDocument(); // Check for specific content inside the calendar

    // Close popover using Escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
        expect(screen.queryByText(/February 2026/)).not.toBeInTheDocument(); // Check for absence of specific content
    });
  });

  it('allows selecting a date from the calendar', async () => {
    const user = userEvent.setup();
    const mockOnDateTimeChange = jest.fn();
    render(
      <DateTimePicker
        date={undefined}
        onDateTimeChange={mockOnDateTimeChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /calender-button/i })); // Open popover

    // Find a date in the current month (e.g., the 15th)
    const dateToSelect = screen.getByRole('gridcell', { name: '15' });
    await user.click(dateToSelect);

    // Expect the popover to close after selecting a date
    await waitFor(() => {
        expect(screen.queryByText(/February 2026/)).not.toBeInTheDocument();
    });

    // Check if onDateTimeChange was called with the correct date (year, month, and day)
    expect(mockOnDateTimeChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnDateTimeChange.mock.calls[0][0];
    expect(calledDate).toBeInstanceOf(Date);
    expect(calledDate.getDate()).toBe(15);
    expect(calledDate.getMonth()).toBe(new Date().getMonth()); // Assuming current month for simplicity
    expect(calledDate.getFullYear()).toBe(new Date().getFullYear()); // Assuming current year for simplicity
    expect(calledDate.getHours()).toBe(0); // Should reset time to 00:00:00
    expect(mockOnDateTimeChange.mock.calls[0][1]).toBe(false); // hasTime should be false
  });

  it('allows selecting an hour, minute, and AM/PM', async () => {
    const user = userEvent.setup();
    const mockOnDateTimeChange = jest.fn();
    const initialDate = new Date(2024, 0, 15, 10, 30); // Jan 15, 2024, 10:30 AM
    render(
      <DateTimePicker
        date={initialDate}
        onDateTimeChange={mockOnDateTimeChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /calender-button/i })); // Open popover

    // Verify time selection elements are present
    expect(screen.getByText('AM')).toBeInTheDocument();
    expect(screen.getByText('PM')).toBeInTheDocument();

    // Select an hour (e.g., 2 PM)
    await user.click(screen.getByRole('button', { name: '2' })); // Select hour 2
    expect(mockOnDateTimeChange).toHaveBeenCalledTimes(1); // One call for hour selection
    let calledDate = mockOnDateTimeChange.mock.calls[0][0];
    expect(calledDate.getHours()).toBe(2); // Should be 2 AM initially before PM is clicked

    await user.click(screen.getByRole('button', { name: 'PM' })); // Select PM
    expect(mockOnDateTimeChange).toHaveBeenCalledTimes(2); // Second call for AM/PM selection
    calledDate = mockOnDateTimeChange.mock.calls[1][0];
    expect(calledDate.getHours()).toBe(14); // 2 PM
    expect(mockOnDateTimeChange.mock.calls[1][1]).toBe(true); // hasTime should be true

    // Select a minute (e.g., 45 minutes)
    await user.click(screen.getByRole('button', { name: '45' }));
    expect(mockOnDateTimeChange).toHaveBeenCalledTimes(3); // Third call for minute selection
    calledDate = mockOnDateTimeChange.mock.calls[2][0];
    expect(calledDate.getMinutes()).toBe(45);
    expect(mockOnDateTimeChange.mock.calls[2][1]).toBe(true); // hasTime should be true
  });
});
