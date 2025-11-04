import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Hero } from '../Hero';
import { Props } from '../../../utils/types';

jest.mock('../CopyButton', () => ({
  CopyButton: ({ text, label }: { text: string; label: string }) => (
    <button
      data-testid={`copy-button-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {text}
    </button>
  ),
}));

jest.mock('../ToastNotification', () => ({
  ToastNotification: () => <div data-testid="toast-notification"></div>,
  showToast: jest.fn(),
}));

describe('Hero component', () => {
  const mockProps: Props = {
    name: 'Test User',
    uuid: '1234-5678-9012-3456',
    encryption_secret: 's3cr3t',
  };

  test('renders without crashing', () => {
    render(<Hero {...mockProps} />);
  });

  test('renders the welcome message with the user name', () => {
    render(<Hero {...mockProps} />);
    const welcomeMessage = screen.getByText(/Welcome,/i);
    const nameMessage = screen.getByText(/Test User!/i);
    expect(welcomeMessage).toBeInTheDocument();
    expect(nameMessage).toBeInTheDocument();
  });

  test('renders the guide message', () => {
    render(<Hero {...mockProps} />);
    const guideMessage = screen.getByText(
      /Follow the guide below to setup sync for your Taskwarrior clients/i
    );
    expect(guideMessage).toBeInTheDocument();
  });

  test('renders the ToastNotification component', () => {
    render(<Hero {...mockProps} />);
    const toastNotification = screen.getByTestId('toast-notification');
    expect(toastNotification).toBeInTheDocument();
  });

  test('renders UUID and encryption secret with toggle buttons', () => {
    render(<Hero {...mockProps} />);

    const uuidCopyButton = screen.getByTestId('copy-button-uuid');
    const secretCopyButton = screen.getByTestId(
      'copy-button-encryption-secret'
    );
    expect(uuidCopyButton).toBeInTheDocument();
    expect(secretCopyButton).toBeInTheDocument();
  });
});
