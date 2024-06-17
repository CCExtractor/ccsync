import { render, screen } from '@testing-library/react';
import { HowItWorks } from '../HowItWorks';

describe('HowItWorks Component', () => {
  test('renders the How It Works section', () => {
    render(<HowItWorks />);

    const sectionElement = screen.getByTestId('#howItWorks');
    expect(sectionElement).toBeInTheDocument();
  });
});
