import { UseTaskDialogFocusMapProps } from '@/components/utils/types';
import React from 'react';

export function useTaskDialogFocusMap<F extends readonly string[]>({
  fields,
  inputRefs,
}: UseTaskDialogFocusMapProps<F>) {
  return React.useCallback(
    (field: F[number]) => {
      const element = inputRefs.current[field];
      if (!element) return;

      element.focus();

      if (
        field === 'due' ||
        field === 'start' ||
        field === 'end' ||
        field === 'wait' ||
        field === 'entry'
      ) {
        element.click();
      }
    },
    [fields, inputRefs]
  );
}
