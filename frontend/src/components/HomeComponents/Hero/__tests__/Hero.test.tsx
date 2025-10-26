import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Hero } from '../Hero';
import { Props } from '../../../utils/types';

jest.mock('../../SetupGuide/CopyableCode', () => ({
  CopyableCode: ({
    text,
    sensitiveValueType,
  }: {
    text: string;
    copyText: string;
    sensitiveValue: string;
    sensitiveValueType: string;
  }) => (
    <div
      data-testid={`copyable-code-${sensitiveValueType.replace(/\s+/g, '-').toLowerCase()}`}
    >
      {text}
    </div>
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

  test('renders CopyableCode components for UUID and encryption secret', () => {
    render(<Hero {...mockProps} />);
    const uuidCode = screen.getByTestId('copyable-code-uuid');
    const encryptionCode = screen.getByTestId('copyable-code-encryption-secret');
    expect(uuidCode).toBeInTheDocument();
    expect(encryptionCode).toBeInTheDocument();
  });
});
