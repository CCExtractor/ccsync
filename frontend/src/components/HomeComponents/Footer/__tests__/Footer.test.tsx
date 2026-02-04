import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Footer } from '../Footer';
import * as utils from '@/components/utils/utils';

jest.mock('../../../../assets/logo.png', () => 'logo-path');
jest.mock('../../../../assets/logo_light.png', () => 'logo-light-path');

describe('Footer component', () => {
  test('renders without crashing', () => {
    render(<Footer />);
  });

  test('renders the logo with correct alt text', () => {
    render(<Footer />);
    const logoElement = screen.getByAltText('Logo');
    expect(logoElement).toBeInTheDocument();
  });

  test('renders the light logo with correct alt text', () => {
    render(<Footer />);
    const logoElement = screen.getByAltText('Logo-light');
    expect(logoElement).toBeInTheDocument();
  });
});

describe('Footer component using Snapshot', () => {
  test('renders correctly', () => {
    const { asFragment } = render(<Footer />);
    expect(asFragment()).toMatchSnapshot();
  });
});

describe('Footer logo click handler', () => {
  test('should call handleLogoClick when logo link is clicked', () => {
    const handleLogoClickSpy = jest.spyOn(utils, 'handleLogoClick');
    render(<Footer />);

    const logoLinks = screen.getAllByRole('link');
    const logoLink = logoLinks.find(
      (link) => link.getAttribute('href') === '#'
    );

    expect(logoLink).toBeDefined();
    fireEvent.click(logoLink!);
    expect(handleLogoClickSpy).toHaveBeenCalledTimes(1);

    handleLogoClickSpy.mockRestore();
  });
});
