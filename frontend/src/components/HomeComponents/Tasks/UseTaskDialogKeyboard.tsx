import { UseTaskDialogKeyboardProps } from '@/components/utils/types';
import React from 'react';

export function useTaskDialogKeyboard<F extends readonly string[]>({
  fields,
  focusedFieldIndex,
  setFocusedFieldIndex,
  isEditingAny,
  triggerEditForField,
  stopEditing,
}: UseTaskDialogKeyboardProps<F>) {
  return React.useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;

      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isTyping) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (isEditingAny) return;
          setFocusedFieldIndex((i) => Math.min(i + 1, fields.length - 1));
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (isEditingAny) return;
          setFocusedFieldIndex((i) => Math.max(i - 1, 0));
          break;

        case 'Enter':
          if (isEditingAny) return;
          e.preventDefault();
          triggerEditForField(fields[focusedFieldIndex]);
          break;

        case 'Escape':
          e.preventDefault();
          stopEditing();
          break;
      }
    },
    [
      fields,
      focusedFieldIndex,
      isEditingAny,
      setFocusedFieldIndex,
      stopEditing,
      triggerEditForField,
    ]
  );
}
