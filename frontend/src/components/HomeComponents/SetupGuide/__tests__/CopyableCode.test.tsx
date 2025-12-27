import React from 'react';
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

// Mock Tooltip component
jest.mock('@/components/ui/tooltip', () => {
  return {
    __esModule: true,
    default: ({
      children,
      title,
    }: {
      children: React.ReactNode;
      title: string;
    }) => (
      <div data-testid="tooltip" data-title={title}>
        {children}
      </div>
    ),
  };
});

// Mock react-copy-to-clipboard
jest.mock('react-copy-to-clipboard', () => {
  return {
    __esModule: true,
    default: ({
      children,
      onCopy,
    }: {
      children: React.ReactNode;
      text: string;
      onCopy?: () => void;
    }) => {
      // Clone children and add onClick handler that calls onCopy
      const childrenWithClick = React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const originalOnClick = (child as any).props?.onClick;
          return React.cloneElement(child as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
              if (originalOnClick) {
                originalOnClick(e);
              }
              if (onCopy) {
                onCopy();
              }
            },
          });
        }
        return child;
      });
      return <>{childrenWithClick}</>;
    },
  };
});

const sampleText = 'Sample code';
const sampleCopyText = 'Copy this text';

describe('CopyableCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with given text', () => {
    render(<CopyableCode text={sampleText} copyText={sampleCopyText} />);

    expect(screen.getByText(sampleText)).toBeInTheDocument();
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
  });

  it('copies text to clipboard and shows toast message', async () => {
    render(<CopyableCode text={sampleText} copyText={sampleCopyText} />);

    const copyButton = screen.getByTestId('copy-icon').closest('button');
    expect(copyButton).toBeInTheDocument();

    if (copyButton) {
      // Click the button which is wrapped by CopyToClipboard
      fireEvent.click(copyButton);
    }

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

  it('does not render sensitive toggle button when isSensitive is false', () => {
    render(
      <CopyableCode
        text={sampleText}
        copyText={sampleCopyText}
        isSensitive={false}
      />
    );

    expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('eye-off-icon')).not.toBeInTheDocument();
  });

  it('renders sensitive toggle button when isSensitive is true', () => {
    render(
      <CopyableCode
        text={sampleText}
        copyText={sampleCopyText}
        isSensitive={true}
      />
    );

    expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
  });

  it('shows full text when isSensitive is true and showSensitive is true', () => {
    render(
      <CopyableCode
        text={sampleText}
        copyText={sampleCopyText}
        isSensitive={true}
      />
    );

    expect(screen.getByText(sampleText)).toBeInTheDocument();
  });

  it('masks sensitive value when isSensitive is true and showSensitive is false', () => {
    const sensitiveText = 'task config sync.encryption_secret my-secret-key';
    render(
      <CopyableCode
        text={sensitiveText}
        copyText={sensitiveText}
        isSensitive={true}
      />
    );

    const toggleButton = screen.getByTestId('eye-off-icon').closest('button');
    expect(toggleButton).toBeInTheDocument();

    if (toggleButton) {
      fireEvent.click(toggleButton);
    }

    const maskedValue = '•'.repeat('my-secret-key'.length);
    expect(
      screen.getByText(`task config sync.encryption_secret ${maskedValue}`)
    ).toBeInTheDocument();
  });

  it('toggles between showing and hiding sensitive value', () => {
    const sensitiveText = 'task config sync.encryption_secret secret123';
    render(
      <CopyableCode
        text={sensitiveText}
        copyText={sensitiveText}
        isSensitive={true}
      />
    );

    expect(screen.getByText(sensitiveText)).toBeInTheDocument();
    expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();

    const toggleButton = screen.getByTestId('eye-off-icon').closest('button');
    expect(toggleButton).toBeInTheDocument();

    if (toggleButton) {
      fireEvent.click(toggleButton);
    }

    const maskedValue = '•'.repeat('secret123'.length);
    expect(
      screen.getByText(`task config sync.encryption_secret ${maskedValue}`)
    ).toBeInTheDocument();
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();

    const showButton = screen.getByTestId('eye-icon').closest('button');
    if (showButton) {
      fireEvent.click(showButton);
    }

    expect(screen.getByText(sensitiveText)).toBeInTheDocument();
    expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
  });

  it('masks only the last part of text with multiple words', () => {
    const multiWordText = 'command part1 part2 secret-value';
    render(
      <CopyableCode
        text={multiWordText}
        copyText={multiWordText}
        isSensitive={true}
      />
    );

    const toggleButton = screen.getByTestId('eye-off-icon').closest('button');
    if (toggleButton) {
      fireEvent.click(toggleButton);
    }

    const maskedValue = '•'.repeat('secret-value'.length);
    expect(
      screen.getByText(`command part1 part2 ${maskedValue}`)
    ).toBeInTheDocument();
  });

  it('handles single word text correctly when masking', () => {
    const singleWord = 'secret-key';
    render(
      <CopyableCode
        text={singleWord}
        copyText={singleWord}
        isSensitive={true}
      />
    );

    const toggleButton = screen.getByTestId('eye-off-icon').closest('button');
    if (toggleButton) {
      fireEvent.click(toggleButton);
    }

    const maskedValue = '•'.repeat(singleWord.length);
    expect(screen.getByText(maskedValue)).toBeInTheDocument();
  });

  it('handles empty string text correctly', () => {
    const { container } = render(
      <CopyableCode text="" copyText="" isSensitive={true} />
    );

    const toggleButton = screen.getByTestId('eye-off-icon').closest('button');
    if (toggleButton) {
      fireEvent.click(toggleButton);
    }

    // Check that the code element exists and is empty
    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement?.textContent).toBe('');
  });

  it('has correct aria-label for toggle button when showing sensitive value', () => {
    render(
      <CopyableCode
        text={sampleText}
        copyText={sampleCopyText}
        isSensitive={true}
      />
    );

    const toggleButton = screen.getByTestId('eye-off-icon').closest('button');
    expect(toggleButton).toHaveAttribute('aria-label', 'Hide sensitive value');
  });

  it('has correct aria-label for toggle button when hiding sensitive value', () => {
    const sensitiveText = 'task config sync.encryption_secret secret123';
    render(
      <CopyableCode
        text={sensitiveText}
        copyText={sensitiveText}
        isSensitive={true}
      />
    );

    const toggleButton = screen.getByTestId('eye-off-icon').closest('button');
    if (toggleButton) {
      fireEvent.click(toggleButton);
    }

    const showButton = screen.getByTestId('eye-icon').closest('button');
    expect(showButton).toHaveAttribute('aria-label', 'Show sensitive value');
  });

  it('has correct tooltip title for toggle button', () => {
    render(
      <CopyableCode
        text={sampleText}
        copyText={sampleCopyText}
        isSensitive={true}
      />
    );

    const tooltips = screen.getAllByTestId('tooltip');
    const toggleTooltip = tooltips.find((tooltip) =>
      tooltip.getAttribute('data-title')?.includes('sensitive')
    );
    expect(toggleTooltip).toBeInTheDocument();
    expect(toggleTooltip?.getAttribute('data-title')).toBe(
      'Hide sensitive value'
    );
  });

  it('has correct tooltip title for copy button', () => {
    render(<CopyableCode text={sampleText} copyText={sampleCopyText} />);

    const tooltips = screen.getAllByTestId('tooltip');
    const copyTooltip = tooltips.find(
      (tooltip) => tooltip.getAttribute('data-title') === 'Copy to clipboard'
    );
    expect(copyTooltip).toBeInTheDocument();
  });
});
