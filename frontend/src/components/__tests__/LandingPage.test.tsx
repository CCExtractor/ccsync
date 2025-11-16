import { render, screen } from '@testing-library/react';
import { LandingPage } from '../LandingPage';

// Mock dependencies
jest.mock('../LandingComponents/Navbar/Navbar', () => ({
  Navbar: () => <div>Mocked Navbar</div>,
}));
jest.mock('../LandingComponents/Hero/Hero', () => ({
  Hero: () => <div>Mocked Hero</div>,
}));
jest.mock('../LandingComponents/About/About', () => ({
  About: () => <div>Mocked About</div>,
}));
jest.mock('../LandingComponents/HowItWorks/HowItWorks', () => ({
  HowItWorks: () => <div>Mocked HowItWorks</div>,
}));
jest.mock('../LandingComponents/Contact/Contact', () => ({
  Contact: () => <div>Mocked Contact</div>,
}));
jest.mock('../LandingComponents/FAQ/FAQ', () => ({
  FAQ: () => <div>Mocked FAQ</div>,
}));
jest.mock('../LandingComponents/Footer/Footer', () => ({
  Footer: () => <div>Mocked Footer</div>,
}));
jest.mock('../../components/utils/ScrollToTop', () => ({
  ScrollToTop: () => <div>Mocked ScrollToTop</div>,
}));

describe('LandingPage Component', () => {
  it('renders all landing page sections', () => {
    render(<LandingPage />);

    expect(screen.getByText('Mocked Navbar')).toBeInTheDocument();
    expect(screen.getByText('Mocked Hero')).toBeInTheDocument();
    expect(screen.getByText('Mocked About')).toBeInTheDocument();
    expect(screen.getByText('Mocked HowItWorks')).toBeInTheDocument();
    expect(screen.getByText('Mocked Contact')).toBeInTheDocument();
    expect(screen.getByText('Mocked FAQ')).toBeInTheDocument();
    expect(screen.getByText('Mocked Footer')).toBeInTheDocument();
    expect(screen.getByText('Mocked ScrollToTop')).toBeInTheDocument();
  });
});
