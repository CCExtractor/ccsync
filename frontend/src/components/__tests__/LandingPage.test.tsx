import { render, screen, waitFor } from '@testing-library/react';
import { LandingPage } from '../LandingPage';

const mockedNavigate = jest.fn();
const consoleErrorSpy = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {});

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

jest.mock('react-router', () => ({
  useNavigate: () => mockedNavigate,
}));

jest.mock('@/components/utils/URLs', () => ({
  url: {
    backendURL: 'http://mocked-backend-url/',
  },
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: false,
  })
) as jest.Mock;

describe('LandingPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  it('renders all components correctly', () => {
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

  it('redirects to /home when the user is already logged in', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    render(<LandingPage />);

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/home');
    });
    expect(fetch).toHaveBeenCalledWith('http://mocked-backend-url/api/user', {
      method: 'GET',
      credentials: 'include',
    });
  });

  it('stays on the landing page when the user is not logged in', async () => {
    render(<LandingPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://mocked-backend-url/api/user', {
        method: 'GET',
        credentials: 'include',
      });
    });
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  it('stays on the landing page when the session check fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

    render(<LandingPage />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    expect(mockedNavigate).not.toHaveBeenCalled();
  });
});

describe('LandingPage Component using Snapshot', () => {
  it('renders landing page correctly', () => {
    const { asFragment } = render(<LandingPage />);
    expect(asFragment()).toMatchSnapshot('landing-page');
  });
});
