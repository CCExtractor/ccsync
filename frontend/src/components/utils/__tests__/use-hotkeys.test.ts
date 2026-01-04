import { renderHook } from '@testing-library/react';
import { useHotkeys } from '../use-hotkeys';

describe('useHotkeys', () => {
  let callback: jest.Mock;

  beforeEach(() => {
    callback = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call callback when specified keys are pressed', () => {
    renderHook(() => useHotkeys(['ctrl', 's'], callback));

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple modifier keys', () => {
    renderHook(() => useHotkeys(['ctrl', 'shift', 'a'], callback));

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should be case insensitive for key matching', () => {
    renderHook(() => useHotkeys(['s'], callback));

    const event = new KeyboardEvent('keydown', {
      key: 'S',
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not trigger when keys do not match', () => {
    renderHook(() => useHotkeys(['ctrl', 's'], callback));

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should not trigger when modifier keys are missing', () => {
    renderHook(() => useHotkeys(['ctrl', 's'], callback));

    const event = new KeyboardEvent('keydown', {
      key: 's',
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should not trigger when focus is in an input field', () => {
    renderHook(() => useHotkeys(['ctrl', 's'], callback));

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });

    Object.defineProperty(event, 'target', { value: input, enumerable: true });
    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should not trigger when focus is in a textarea', () => {
    renderHook(() => useHotkeys(['ctrl', 's'], callback));

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });

    Object.defineProperty(event, 'target', {
      value: textarea,
      enumerable: true,
    });
    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it('should not trigger when focus is in a select element', () => {
    renderHook(() => useHotkeys(['ctrl', 's'], callback));

    const select = document.createElement('select');
    document.body.appendChild(select);

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });

    Object.defineProperty(event, 'target', { value: select, enumerable: true });
    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(select);
  });

  it('should not trigger when focus is in a contentEditable element', () => {
    renderHook(() => useHotkeys(['ctrl', 's'], callback));

    const div = document.createElement('div');
    div.contentEditable = 'true';
    document.body.appendChild(div);

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });

    // Mock both contentEditable and isContentEditable
    Object.defineProperty(div, 'isContentEditable', {
      value: true,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(event, 'target', { value: div, enumerable: true });

    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(div);
  });

  it('should prevent default behavior when hotkey is triggered', () => {
    renderHook(() => useHotkeys(['ctrl', 's'], callback));

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });

    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle alt modifier key', () => {
    renderHook(() => useHotkeys(['alt', 'f'], callback));

    const event = new KeyboardEvent('keydown', {
      key: 'f',
      altKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useHotkeys(['ctrl', 's'], callback));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });
});
