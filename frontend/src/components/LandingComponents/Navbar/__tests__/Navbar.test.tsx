import { render } from '@testing-library/react';
import { Navbar } from '../Navbar';

jest.mock('../../../../assets/logo.png', () => 'mocked-logo.png');
jest.mock('../../../../assets/logo_light.png', () => 'mocked-logo-light.png');

describe('Navbar component', () => {
  it('renders navbar with desktop and mobile navigation', () => {
    const { getByAltText, getByText } = render(<Navbar />);

    const logoLight = getByAltText('Logo-Light');
    expect(logoLight).toBeInTheDocument();

    const logoRegular = getByAltText('Logo');
    expect(logoRegular).toBeInTheDocument();

    const homeLink = getByText('Home');
    expect(homeLink).toBeInTheDocument();

    const aboutLink = getByText('About');
    expect(aboutLink).toBeInTheDocument();

    const howItWorksLink = getByText('How it works');
    expect(howItWorksLink).toBeInTheDocument();

    const contactUsLink = getByText('Contact Us');
    expect(contactUsLink).toBeInTheDocument();

    const faqLink = getByText('FAQ');
    expect(faqLink).toBeInTheDocument();
  });
});

describe('Navbar component using snapshot', () => {
  it('renders correctly', () => {
    const { asFragment } = render(<Navbar />);
    expect(asFragment()).toMatchSnapshot();
  });
});
