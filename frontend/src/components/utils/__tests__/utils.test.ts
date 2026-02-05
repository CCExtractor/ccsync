import { MouseEvent } from 'react';
import { handleLogoClick } from '../utils';

describe('handleLogoClick', () => {
  let mockEvent: Partial<MouseEvent<HTMLAnchorElement>>;
  let reloadMock: jest.Mock;

  beforeEach(() => {
    mockEvent = {
      preventDefault: jest.fn(),
    };

    // Mock reload using Object.defineProperty
    reloadMock = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });
  });

  it('should call preventDefault on the event', () => {
    handleLogoClick(mockEvent as MouseEvent<HTMLAnchorElement>);

    expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('should reload the page', () => {
    handleLogoClick(mockEvent as MouseEvent<HTMLAnchorElement>);

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('should call preventDefault before reloading', () => {
    const callOrder: string[] = [];

    mockEvent.preventDefault = jest.fn(() => {
      callOrder.push('preventDefault');
    });

    reloadMock.mockImplementation(() => {
      callOrder.push('reload');
    });

    handleLogoClick(mockEvent as MouseEvent<HTMLAnchorElement>);

    expect(callOrder).toEqual(['preventDefault', 'reload']);
  });
});
