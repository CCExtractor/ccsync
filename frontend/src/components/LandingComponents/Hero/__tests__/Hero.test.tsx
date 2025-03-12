import React from 'react';
import { render, screen } from '@testing-library/react';
import { Hero } from '../Hero';
import { url } from '@/components/utils/URLs';

// mocking the HeroCards component
jest.mock('../HeroCards', () => ({
  HeroCards: () => <div data-testid="hero-cards">HeroCards Component</div>,
}));

// mocking the buttonVariants function
jest.mock('../../../ui/button', () => ({
  Button: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <button className={className}>{children}</button>,
  buttonVariants: ({ variant }: { variant: string }) => `btn-${variant}`,
}));

describe('Hero Component', () => {
  test('renders Hero component with correct text and elements', () => {
    render(<Hero />);
    // check for buttons and links
    const signInButton = screen.getByText(/Sign in to get started/i);
    expect(signInButton.closest('a')).toHaveAttribute(
      'href',
      url.backendURL + 'auth/oauth'
    );
    expect(signInButton).toHaveClass(
      'w-full md:w-1/3 bg-blue-400 hover:bg-blue-500'
    );

    const githubButton = screen.getByText(/Github Repository/i);
    expect(githubButton.closest('a')).toHaveAttribute(
      'href',
      url.githubRepoURL,
    );
    expect(githubButton.closest('a')).toHaveAttribute('target', '_blank');
    expect(githubButton).toHaveClass('w-full md:w-1/3 btn-outline');
    expect(screen.getByTestId('hero-cards')).toBeInTheDocument();
  });

  test('renders HeroCards component', () => {
    render(<Hero />);
    expect(screen.getByTestId('hero-cards')).toBeInTheDocument();
  });
});
