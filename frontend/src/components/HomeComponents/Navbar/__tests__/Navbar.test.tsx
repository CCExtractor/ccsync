import { render, screen } from '@testing-library/react';
import { Navbar } from '../Navbar';
import { Props } from '../navbar-utils';

// Mocking the NavbarMobile and NavbarDesktop components
jest.mock('../NavbarMobile', () => ({
  NavbarMobile: ({
    isOpen,
  }: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
  }) => <div data-testid="navbar-mobile" data-isopen={isOpen} />,
}));

jest.mock('../NavbarDesktop', () => ({
  NavbarDesktop: (_props: Props) => <div data-testid="navbar-desktop" />,
}));

// Mocking the logo images
jest.mock('../../../../assets/logo.png', () => 'logo.png');
jest.mock('../../../../assets/logo_light.png', () => 'logo_light.png');

describe('Navbar Component', () => {
  const mockSetIsLoading = jest.fn();

  const props: Props & {
    isLoading: boolean;
    setIsLoading: (val: boolean) => void;
  } = {
    imgurl: '',
    email: '',
    encryptionSecret: '',
    origin: '',
    UUID: '',
    isLoading: false,
    tasks: [],
    setIsLoading: mockSetIsLoading,
  };

  test('renders Navbar component with correct elements', () => {
    render(<Navbar {...props} />);

    const logoLightImage = screen.getByAltText('Light-Logo');
    const logoImage = screen.getByAltText('Logo');

    expect(logoLightImage).toBeInTheDocument();
    expect(logoImage).toBeInTheDocument();

    // Check for NavbarDesktop and NavbarMobile components
    expect(screen.getByTestId('navbar-desktop')).toBeInTheDocument();
    expect(screen.getByTestId('navbar-mobile')).toBeInTheDocument();
  });

  test('NavbarMobile component receives correct props', () => {
    render(<Navbar {...props} />);

    const navbarMobile = screen.getByTestId('navbar-mobile');
    expect(navbarMobile).toHaveAttribute('data-isopen', 'false');
  });
});
