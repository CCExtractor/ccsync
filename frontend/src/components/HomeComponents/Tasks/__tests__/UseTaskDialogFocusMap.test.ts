import { act, renderHook } from '@testing-library/react';
import { useTaskDialogFocusMap } from '../UseTaskDialogFocusMap';

describe('UseTaskDialogFocusMap', () => {
  test('focus is being called for any field with an element', () => {
    const focus = jest.fn();
    const click = jest.fn();

    const inputrefs = {
      current: {
        description: { focus, click },
      },
    };

    const { result } = renderHook(() =>
      useTaskDialogFocusMap({
        fields: ['description'],
        inputRefs: inputrefs as any,
      })
    );

    act(() => {
      result.current('description');
    });

    expect(focus).toHaveBeenCalled();
  });

  test('click is being called for date field', () => {
    const focus = jest.fn();
    const click = jest.fn();

    const inputrefs = {
      current: {
        due: { focus, click },
      },
    };

    const { result } = renderHook(() =>
      useTaskDialogFocusMap({
        fields: ['due'],
        inputRefs: inputrefs as any,
      })
    );

    act(() => {
      result.current('due');
    });

    expect(focus).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });
});
