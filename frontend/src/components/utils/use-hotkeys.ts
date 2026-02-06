import { useEffect } from 'react';

export function useHotkeys(
  keys: string[],
  callback: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        return;
      }

      if (
        keys.every(
          (k) =>
            (k === 'ctrl' && e.ctrlKey) ||
            (k === 'shift' && e.shiftKey) ||
            (k === 'alt' && e.altKey) ||
            e.key.toLowerCase() === k.toLowerCase()
        )
      ) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keys, callback, enabled]);
}
