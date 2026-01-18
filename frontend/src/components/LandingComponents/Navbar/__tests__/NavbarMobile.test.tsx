import { NavbarMobile } from '../NavbarMobile';
import { fireEvent, render, screen } from '@testing-library/react';

describe('NavbarMobile component using snapshot', () => {
  it('renders correctly', () => {
    const { asFragment } = render(<NavbarMobile />);
    expect(asFragment()).toMatchSnapshot();
  });
});

describe('NavbarMobile component test', () => {
  test('renders ModeToggle and menu trigger', () => {
    render(<NavbarMobile />);

    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
  });

  test('menu should NOT be visible initially', () => {
    render(<NavbarMobile />);

    expect(screen.queryByText('CCSync')).not.toBeInTheDocument();
    expect(screen.queryByTestId('route-list')).not.toBeInTheDocument();
  });

  test('clicking on menu-icon opens menu', () => {
    render(<NavbarMobile />);

    const button = screen.getByTestId('menu-icon');
    fireEvent.click(button);

    expect(screen.getByText('CCSync')).toBeInTheDocument();
    expect(screen.getByTestId('route-list')).toBeInTheDocument();
  });

  test('clicking on any route closes menu -> setIsOpen(false)', () => {
    render(<NavbarMobile />);

    fireEvent.click(screen.getByTestId('menu-icon'));

    // click the first route label (example)
    // replace "Home" with your real first label from routeList
    const firstRoute = screen.getByRole('link', { name: /home/i });
    fireEvent.click(firstRoute);

    // menu should close
    expect(screen.queryByTestId('route-list')).not.toBeInTheDocument();
  });
});
