import { render, fireEvent, screen } from '@testing-library/react';
import { ScrollToTop } from '../ScrollToTop';

// Mock the window.scroll function
global.scroll = jest.fn();

describe('ScrollToTop Component', () => {
  it('does not show the button initially', () => {
    render(<ScrollToTop />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the button after scrolling down more than 400 pixels', () => {
    render(<ScrollToTop />);
    
    // Simulate scrolling down
    fireEvent.scroll(window, { target: { scrollY: 500 } });
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('hides the button when scrolled back up above 400 pixels', () => {
    render(<ScrollToTop />);
    
    // Simulate scrolling down
    fireEvent.scroll(window, { target: { scrollY: 500 } });
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    // Simulate scrolling back up
    fireEvent.scroll(window, { target: { scrollY: 300 } });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('scrolls to the top when button is clicked', () => {
    render(<ScrollToTop />);
    
    // Simulate scrolling down
    fireEvent.scroll(window, { target: { scrollY: 500 } });
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    // Click the button
    fireEvent.click(screen.getByRole('button'));
    
    // Check if the scroll function was called with the correct parameters
    expect(global.scroll).toHaveBeenCalledWith({
      top: 0,
      left: 0,
    });
  });
});
