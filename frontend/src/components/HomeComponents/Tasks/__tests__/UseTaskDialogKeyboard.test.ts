import { act, renderHook } from '@testing-library/react';
import { useTaskDialogKeyboard } from '../UseTaskDialogKeyboard';

const FIELDS = ['Description', 'start', 'due'] as const;
const setFocusedFieldIndex = jest.fn();
const triggerEditForField = jest.fn();
const stopEditing = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('UseTaskDialogKeyboard', () => {
  test('ArrowDown increments focusFieldsIndex', () => {
    const { result } = renderHook(() =>
      useTaskDialogKeyboard({
        fields: FIELDS,
        focusedFieldIndex: 0,
        setFocusedFieldIndex,
        stopEditing,
        isEditingAny: false,
        triggerEditForField,
      })
    );

    act(() => {
      result.current({
        key: 'ArrowDown',
        preventDefault: jest.fn(),
        target: document.body,
      } as any);
    });

    expect(setFocusedFieldIndex).toHaveBeenCalled();
  });

  test('ArrowUp decrement focusFieldsIndex', () => {
    const { result } = renderHook(() =>
      useTaskDialogKeyboard({
        fields: FIELDS,
        focusedFieldIndex: 1,
        setFocusedFieldIndex,
        stopEditing,
        isEditingAny: false,
        triggerEditForField,
      })
    );

    act(() => {
      result.current({
        key: 'ArrowUp',
        preventDefault: jest.fn(),
        target: document.body,
      } as any);
    });

    expect(setFocusedFieldIndex).toHaveBeenCalled();
  });

  test('Enter key trigger edit for focusfield', () => {
    const { result } = renderHook(() =>
      useTaskDialogKeyboard({
        fields: FIELDS,
        focusedFieldIndex: 2,
        setFocusedFieldIndex: jest.fn(),
        stopEditing: jest.fn(),
        isEditingAny: false,
        triggerEditForField,
      })
    );

    act(() => {
      result.current({
        key: 'Enter',
        preventDefault: jest.fn(),
        target: document.body,
      } as any);
    });

    expect(triggerEditForField).toHaveBeenCalledWith('due');
  });

  test('Escape key exit editing mode', () => {
    const { result } = renderHook(() =>
      useTaskDialogKeyboard({
        fields: FIELDS,
        focusedFieldIndex: 1,
        setFocusedFieldIndex: jest.fn(),
        stopEditing,
        isEditingAny: false,
        triggerEditForField: jest.fn(),
      })
    );

    act(() => {
      result.current({
        key: 'Escape',
        preventDefault: jest.fn(),
        target: document.body,
      } as any);
    });

    expect(stopEditing).toHaveBeenCalled();
  });

  test('prevent navigating when editing', () => {
    const { result } = renderHook(() =>
      useTaskDialogKeyboard({
        fields: FIELDS,
        focusedFieldIndex: 0,
        setFocusedFieldIndex,
        stopEditing,
        isEditingAny: true,
        triggerEditForField,
      })
    );

    act(() => {
      result.current({
        key: 'ArrowDown',
        preventDefault: jest.fn(),
        target: document.createElement('div'),
      } as any);
    });

    expect(setFocusedFieldIndex).not.toHaveBeenCalled();
  });
});
