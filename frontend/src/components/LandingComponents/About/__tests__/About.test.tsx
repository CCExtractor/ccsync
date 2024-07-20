// About.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { About } from '../About';
import { useInView } from 'react-intersection-observer';

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));

describe('About Component', () => {
  beforeEach(() => {
    (useInView as jest.Mock).mockReturnValue({
      ref: jest.fn(),
      inView: true,
    });
  });

  it('renders the About section', () => {
    render(<About />);
    const aboutSection = screen.getByTestId('about-section');
    expect(aboutSection).toBeInTheDocument();
  });

  it('renders the heading correctly', () => {
    render(<About />);
    const heading = screen.getByRole('heading', { name: /About CCSync/i });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('About CCSync');
  });

  it('renders the paragraph text correctly', () => {
    render(<About />);
    const paragraph = screen.getByText(/CCSync uses a hosted Taskchampion Sync Server instance/i);
    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveTextContent('CCSync uses a hosted Taskchampion Sync Server instance that helps users to sync tasks across all your Taskwarrior 3.0 clients and higher.');
  });

  it('renders additional paragraph content correctly', () => {
    render(<About />);
    const paragraph = screen.getByText(/Users can sign in using Google and generate their secret keys to setup synchronisation on their Taskwarrior clients/i);
    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveTextContent('Users can sign in using Google and generate their secret keys to setup synchronisation on their Taskwarrior clients.');
  });
});
