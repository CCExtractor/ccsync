import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import type { Plugin } from 'pretty-format';

// ResizeObserver polyfill
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ScrollIntoView mock
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// PointerEvent mock
class MockPointerEvent extends Event {
  button: number;
  ctrlKey: boolean;
  pointerType: string;

  constructor(type: string, props: PointerEventInit) {
    super(type, props);
    this.button = props.button || 0;
    this.ctrlKey = props.ctrlKey || false;
    this.pointerType = props.pointerType || 'mouse';
  }
}
window.PointerEvent = MockPointerEvent as any;
window.HTMLElement.prototype.hasPointerCapture = jest.fn();
window.HTMLElement.prototype.releasePointerCapture = jest.fn();

let isSerializing = false;

const radixSnapshotSerializer: Plugin = {
  test(val) {
    return (
      !isSerializing &&
      val &&
      typeof val === 'object' &&
      'nodeType' in (val as any) &&
      ((val as any).nodeType === 1 || (val as any).nodeType === 11)
    );
  },
  print(val, serialize) {
    const clone = (val as any).cloneNode(true);

    if (clone && typeof (clone as any).querySelectorAll === 'function') {
      const elements = (clone as any).querySelectorAll(
        '[id],[aria-controls],[aria-labelledby]'
      );

      elements.forEach((element: Element) => {
        const id = element.getAttribute('id');
        if (id && id.startsWith('radix-:r')) {
          element.setAttribute('id', 'radix-:ID:');
        }

        const ariaControls = element.getAttribute('aria-controls');
        if (ariaControls && ariaControls.startsWith('radix-:r')) {
          element.setAttribute('aria-controls', 'radix-:ID:');
        }

        const ariaLabelledby = element.getAttribute('aria-labelledby');
        if (ariaLabelledby && ariaLabelledby.startsWith('radix-:r')) {
          element.setAttribute('aria-labelledby', 'radix-:ID:');
        }
      });
    }

    isSerializing = true;
    const result = serialize(clone);
    isSerializing = false;
    return result;
  },
};

// Serializer Radix actif uniquement pour les snapshots (quand RADIX_SNAPSHOT=1)
if (process.env.RADIX_SNAPSHOT) {
  expect.addSnapshotSerializer(radixSnapshotSerializer);
}
