import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HowItWorks } from '../HowItWorks';
import { useInView } from 'react-intersection-observer';

// Mock useInView hook
jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));

beforeEach(() => {
  (useInView as jest.Mock).mockReturnValue({
    ref: jest.fn(),
    inView: true, // Set inView to true to simulate the element being in view
  });
});

describe('HowItWorks Component', () => {
  test('renders the How It Works section', () => {
    render(<HowItWorks />);

    const sectionElement = screen.getByTestId('#howItWorks');
    expect(sectionElement).toBeInTheDocument();
  });

  test('renders all feature cards', () => {
    render(<HowItWorks />);

    const featureTitles = ['Sign in', 'Setup', 'Share', 'Deploy your own'];

    featureTitles.forEach((title) => {
      const featureCard = screen.getByText(title);
      expect(featureCard).toBeInTheDocument();
    });
  });

  test('renders the correct descriptions for feature cards', () => {
    render(<HowItWorks />);

    const featureDescriptions = [
      'Sign in with Google to generate secret UUIDs, or generate your own using a random key generator',
      'Setup the taskserver for your Taskwarrior clients by following the documentation',
      'Sign in on multiple devices and use the same UUIDs to sync tasks across all the clients or your team',
      'You can also deploy your own server instance by following this documentation',
    ];

    featureDescriptions.forEach((description) => {
      const featureDescription = screen.getByText(description);
      expect(featureDescription).toBeInTheDocument();
    });
  });
});

describe('HowItWorks component using snapshot', () => {
  it('renders correctly', () => {
    const { asFragment } = render(<HowItWorks />);
    expect(asFragment()).toMatchSnapshot();
  });
});
