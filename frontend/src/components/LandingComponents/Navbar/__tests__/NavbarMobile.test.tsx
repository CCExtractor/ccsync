import { NavbarMobile } from '../NavbarMobile';
import { render } from '@testing-library/react';

describe('NavbarMobile component using snapshot', () => {
  it('renders correctly', () => {
    const { asFragment } = render(<NavbarMobile />);
    expect(asFragment()).toMatchSnapshot();
  });
});
