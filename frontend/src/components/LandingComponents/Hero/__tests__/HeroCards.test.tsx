import { render, screen } from '@testing-library/react';
import { HeroCards } from '../HeroCards';

describe('HeroCards Component', () => {
  it('renders all cards with the correct content', () => {
    render(<HeroCards />);

    // test for cards
    expect(screen.getByText(/Keep your data safe with top-notch security features./i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in to generate your keys in order to sync across all your Taskwarrior clients/i)).toBeInTheDocument();
    expect(screen.getByText(/Hassle-free sync across all devices/i)).toBeInTheDocument();
    expect(screen.getByText(/Have any issues or queries?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Contact us/i })).toHaveAttribute('href', '#contact');
  });
});
