import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyableCode } from '../CopyableCode';
import { toast } from 'react-toastify';

// Mock the toast function
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
  },
}));

// Mock CopyIcon
jest.mock('lucide-react', () => ({
  CopyIcon: () => <svg data-testid="copy-icon"></svg>,
}));

describe('CopyableCode', () => {
  const sampleText = 'Sample code';
  const sampleCopyText = 'Copy this text';

  it('renders correctly with given text', () => {
    render(<CopyableCode text={sampleText} copyText={sampleCopyText} />);

    expect(screen.getByText(sampleText)).toBeInTheDocument();
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
  });

  it('copies text to clipboard and shows toast message', async () => {
    render(<CopyableCode text={sampleText} copyText={sampleCopyText} />);

    fireEvent.click(screen.getByTestId('copy-icon'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        `${sampleCopyText} copied to clipboard!`,
        {
          position: 'bottom-left',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        }
      );
    });
  });
});
