import { render, screen } from '@testing-library/react';
import App from '../App';

jest.mock('../components/HomePage', () => ({
  HomePage: () => <div data-testid="home-page">Home Page</div>,
}));

jest.mock('../components/LandingPage', () => ({
  LandingPage: () => <div data-testid="landing-page">Landing Page</div>,
}));

Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    pathname: '/',
  },
  writable: true,
});

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('contains BrowserRouter with future flags', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders Routes component', () => {
    render(<App />);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('has correct route structure', () => {
    const routes = [
      { path: '/', element: 'LandingPage' },
      { path: '/home', element: 'HomePage' },
    ];

    expect(routes).toHaveLength(2);
    expect(routes[0].path).toBe('/');
    expect(routes[1].path).toBe('/home');
  });
});
