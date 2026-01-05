import { UseTaskDialogFocusMapProps } from '@/components/utils/types';
import React from 'react';

export function useTaskDialogFocusMap<F extends readonly string[]>({
  fields,
  inputRefs,
}: UseTaskDialogFocusMapProps<F>) {
  return React.useCallback(
    (field: F[number]) => {
      const el = inputRefs.current[field];
      if (!el) return;

      el.focus();

      if (
        field === 'due' ||
        field === 'start' ||
        field === 'end' ||
        field === 'wait' ||
        field === 'entry'
      ) {
        el.click();
      }
    },
    [fields, inputRefs]
  );
}
