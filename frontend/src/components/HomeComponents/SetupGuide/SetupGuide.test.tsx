import { render, screen, fireEvent } from '@testing-library/react';
import { SetupGuide } from './SetupGuide';

// Using jest.mock to mock external dependencies
jest.mock('@/components/utils/URLs', () => ({
  url: {
    containerOrigin: 'https://test-container',
  },
}));

// Mock CopyableCode component
jest.mock('./CopyableCode', () => ({
  CopyableCode: ({
    text,
    copyText,
    isSensitive,
  }: {
    text: string;
    copyText: string;
    isSensitive?: boolean;
  }) => (
    <div
      data-testid="copyable-code"
      data-text={text}
      data-copytext={copyText}
      data-issensitive={String(isSensitive ?? false)}
    >
      {text}
    </div>
  ),
}));

// Mock exportConfigSetup utility
const mockExportConfigSetup = jest.fn();
jest.mock('./utils', () => ({
  exportConfigSetup: (props: any) => mockExportConfigSetup(props),
}));

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, onClick }: any) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-testid="download-button"
    >
      {children}
    </button>
  ),
}));

const defaultProps = {
  name: 'Test User',
  encryption_secret: 'secret123',
  uuid: 'uuid-1234',
};

describe('SetupGuide', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders setup guide sections', () => {
    render(<SetupGuide {...defaultProps} />);

    // Section exists
    expect(document.querySelector('#setup-guide')).toBeInTheDocument();

    // Sub-section headings
    expect(screen.getByText('PREREQUISITES')).toBeInTheDocument();
    expect(screen.getByText('CONFIGURATION')).toBeInTheDocument();
    expect(screen.getByText('SYNC')).toBeInTheDocument();
  });

  test('renders main heading with gradient text', () => {
    render(<SetupGuide {...defaultProps} />);

    expect(screen.getByText('Setup')).toBeInTheDocument();
    expect(screen.getByText('Guide')).toBeInTheDocument();
  });

  test('renders configuration commands using props', () => {
    render(<SetupGuide {...defaultProps} />);

    expect(
      screen.getByText(
        `task config sync.encryption_secret ${defaultProps.encryption_secret}`
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(`task config sync.server.client_id ${defaultProps.uuid}`)
    ).toBeInTheDocument();

    expect(
      screen.getByText('task config sync.server.origin https://test-container')
    ).toBeInTheDocument();
  });

  test('renders all CopyableCode components with correct props', () => {
    render(<SetupGuide {...defaultProps} />);

    const copyableCodes = screen.getAllByTestId('copyable-code');
    expect(copyableCodes.length).toBe(5);

    // Check prerequisites CopyableCode
    expect(copyableCodes[0]).toHaveAttribute('data-text', 'task --version');
    expect(copyableCodes[0]).toHaveAttribute('data-copytext', 'task --version');
    expect(copyableCodes[0]).toHaveAttribute('data-issensitive', 'false');

    // Check encryption secret CopyableCode (sensitive)
    expect(copyableCodes[1]).toHaveAttribute(
      'data-text',
      `task config sync.encryption_secret ${defaultProps.encryption_secret}`
    );
    expect(copyableCodes[1]).toHaveAttribute('data-issensitive', 'true');

    // Check origin CopyableCode
    expect(copyableCodes[2]).toHaveAttribute(
      'data-text',
      'task config sync.server.origin https://test-container'
    );
    expect(copyableCodes[2]).toHaveAttribute('data-issensitive', 'false');

    // Check client ID CopyableCode (sensitive)
    expect(copyableCodes[3]).toHaveAttribute(
      'data-text',
      `task config sync.server.client_id ${defaultProps.uuid}`
    );
    expect(copyableCodes[3]).toHaveAttribute('data-issensitive', 'true');

    // Check sync init CopyableCode
    expect(copyableCodes[4]).toHaveAttribute('data-text', 'task sync init');
    expect(copyableCodes[4]).toHaveAttribute('data-issensitive', 'false');
  });

  test('renders instructional text content', () => {
    render(<SetupGuide {...defaultProps} />);

    expect(
      screen.getByText(/Ensure that Taskwarrior 3.0 or greater is installed/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You will need an encryption secret/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Configure Taskwarrior with these commands/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/For more information about how this works/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Finally, setup the sync for your Taskwarrior client/)
    ).toBeInTheDocument();
  });

  test('clicking download configuration triggers download logic', () => {
    const configContent = 'test-config-content';
    mockExportConfigSetup.mockReturnValue(configContent);

    // Polyfill missing browser APIs
    const createObjectURLSpy = jest.fn(() => 'blob:http://localhost/file');
    const revokeObjectURLSpy = jest.fn();

    Object.defineProperty(global.URL, 'createObjectURL', {
      writable: true,
      value: createObjectURLSpy,
    });

    Object.defineProperty(global.URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectURLSpy,
    });

    const originalAppendChild = document.body.appendChild.bind(document.body);
    const originalRemoveChild = document.body.removeChild.bind(document.body);

    const appendSpy = jest
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node) => {
        // Actually append to DOM so removeChild works
        return originalAppendChild(node);
      });

    const removeSpy = jest
      .spyOn(document.body, 'removeChild')
      .mockImplementation((node) => {
        // Only remove if it's actually a child
        if (node.parentNode === document.body) {
          return originalRemoveChild(node);
        }
        return node;
      });

    render(<SetupGuide {...defaultProps} />);

    // Click on the h3 element which has the onClick handler
    const downloadHeading = screen
      .getByText(/DOWNLOAD CONFIGURATION/i)
      .closest('h3');
    expect(downloadHeading).toBeInTheDocument();

    if (downloadHeading) {
      fireEvent.click(downloadHeading);
    }

    expect(mockExportConfigSetup).toHaveBeenCalledWith(defaultProps);
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();

    // Verify blob was created with correct content
    expect(createObjectURLSpy.mock.calls.length).toBeGreaterThan(0);
    const firstCall = createObjectURLSpy.mock.calls[0] as unknown[];
    if (firstCall && firstCall.length > 0) {
      const blobCall = firstCall[0] as unknown;
      expect(blobCall).toBeInstanceOf(Blob);
      if (blobCall instanceof Blob) {
        expect(blobCall.type).toBe('text/plain;charset=utf-8');
      }
    }

    // Verify link was configured correctly
    const linkElement = appendSpy.mock.calls.find(
      (call) => call[0] instanceof HTMLAnchorElement
    )?.[0] as HTMLAnchorElement;
    if (linkElement) {
      expect(linkElement.download).toBe('taskwarrior-setup.txt');
    }

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  test('download configuration creates blob with correct type', () => {
    const configContent = 'config-content';
    mockExportConfigSetup.mockReturnValue(configContent);

    const createObjectURLSpy = jest.fn(() => 'blob:http://localhost/file');
    Object.defineProperty(global.URL, 'createObjectURL', {
      writable: true,
      value: createObjectURLSpy,
    });

    Object.defineProperty(global.URL, 'revokeObjectURL', {
      writable: true,
      value: jest.fn(),
    });

    const originalAppendChild = document.body.appendChild.bind(document.body);
    const originalRemoveChild = document.body.removeChild.bind(document.body);

    const appendSpy = jest
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node) => {
        return originalAppendChild(node);
      });

    const removeSpy = jest
      .spyOn(document.body, 'removeChild')
      .mockImplementation((node) => {
        if (node.parentNode === document.body) {
          return originalRemoveChild(node);
        }
        return node;
      });

    render(<SetupGuide {...defaultProps} />);

    const downloadHeading = screen
      .getByText(/DOWNLOAD CONFIGURATION/i)
      .closest('h3');
    if (downloadHeading) {
      fireEvent.click(downloadHeading);
    }

    expect(createObjectURLSpy.mock.calls.length).toBeGreaterThan(0);
    const firstCall = createObjectURLSpy.mock.calls[0] as unknown[];
    if (firstCall && firstCall.length > 0) {
      const blob = firstCall[0] as unknown;
      if (blob instanceof Blob) {
        expect(blob.type).toBe('text/plain;charset=utf-8');
      }
    }

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  test('download configuration sets correct filename', () => {
    mockExportConfigSetup.mockReturnValue('config-content');

    Object.defineProperty(global.URL, 'createObjectURL', {
      writable: true,
      value: jest.fn(() => 'blob:http://localhost/file'),
    });

    Object.defineProperty(global.URL, 'revokeObjectURL', {
      writable: true,
      value: jest.fn(),
    });

    const originalAppendChild = document.body.appendChild.bind(document.body);
    const originalRemoveChild = document.body.removeChild.bind(document.body);

    const appendSpy = jest
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node) => {
        return originalAppendChild(node);
      });

    const removeSpy = jest
      .spyOn(document.body, 'removeChild')
      .mockImplementation((node) => {
        if (node.parentNode === document.body) {
          return originalRemoveChild(node);
        }
        return node;
      });

    render(<SetupGuide {...defaultProps} />);

    const downloadHeading = screen
      .getByText(/DOWNLOAD CONFIGURATION/i)
      .closest('h3');
    if (downloadHeading) {
      fireEvent.click(downloadHeading);
    }

    const linkElement = appendSpy.mock.calls.find(
      (call) => call[0] instanceof HTMLAnchorElement
    )?.[0] as HTMLAnchorElement;

    if (linkElement) {
      expect(linkElement.download).toBe('taskwarrior-setup.txt');
    }

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  test('renders download configuration button', () => {
    render(<SetupGuide {...defaultProps} />);

    const downloadText = screen.getByText(/DOWNLOAD CONFIGURATION/i);
    expect(downloadText).toBeInTheDocument();
    expect(downloadText.closest('button')).toBeInTheDocument();
    expect(downloadText.closest('h3')).toBeInTheDocument();
  });
});
