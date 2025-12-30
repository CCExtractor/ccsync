import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyableCode } from '../CopyableCode';
import { toast } from 'react-toastify';

// Mock the toast function
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
  },
}));

// Mock icons
jest.mock('lucide-react', () => ({
  CopyIcon: () => <svg data-testid="copy-icon"></svg>,
  Eye: () => <svg data-testid="eye-icon"></svg>,
  EyeOff: () => <svg data-testid="eye-off-icon"></svg>,
}));

const sampleText = 'Sample code';
const sampleCopyText = 'Copy this text';

describe('CopyableCode', () => {
  it('renders correctly with given text', () => {
    render(<CopyableCode text={sampleText} copyText={sampleCopyText} />);

    expect(screen.getByText(sampleText)).toBeInTheDocument();
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
  });
  it('toggles sensitive value visibility and masks the text', () => {
    const sensitiveText = 'API_KEY 12345';

    render(
      <CopyableCode
        text={sensitiveText}
        copyText={sensitiveText}
        isSensitive={true}
      />
    );
    expect(screen.getByText(sensitiveText)).toBeInTheDocument();
    expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /hide sensitive value/i })
    );
    expect(screen.getByText('API_KEY •••••')).toBeInTheDocument();
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
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

describe('SetupGuide component using snapshot', () => {
  test('renders correctly', () => {
    const { asFragment } = render(
      <CopyableCode text={sampleText} copyText={sampleCopyText} />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
