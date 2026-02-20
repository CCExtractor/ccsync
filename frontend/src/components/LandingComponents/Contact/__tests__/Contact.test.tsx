// Contact.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Contact } from '../Contact';
import { useInView } from 'react-intersection-observer';

// Mock useInView hook
jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(),
}));

describe('Contact Component', () => {
  beforeEach(() => {
    (useInView as jest.Mock).mockReturnValue({
      ref: jest.fn(),
      inView: true, // Set inView to true to simulate the element being in view
    });
  });

  test('renders the Contact section', () => {
    render(<Contact />);
    const sectionElement = screen.getByTestId('#contact');
    expect(sectionElement).toBeInTheDocument();
  });

  test('renders all contact cards', () => {
    render(<Contact />);

    const contactNames = ['Zulip', 'Github', 'Discord'];

    contactNames.forEach((name) => {
      const contactCard = screen.getByText(name);
      expect(contactCard).toBeInTheDocument();
    });
  });

  test('renders the correct positions for contact cards', () => {
    render(<Contact />);

    const contactPositions = [
      'Join our Zulip channel',
      'Check out our Github repository',
      'Join us at Discord for discussions',
    ];

    contactPositions.forEach((position) => {
      const contactPosition = screen.getByText(position);
      expect(contactPosition).toBeInTheDocument();
    });
  });
});
