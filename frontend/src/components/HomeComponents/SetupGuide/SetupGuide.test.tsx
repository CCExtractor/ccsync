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
  CopyableCode: ({ text }: { text: string }) => (
    <div data-testid="copyable-code">{text}</div>
  ),
}));

// Mock exportConfigSetup utility
const mockExportConfigSetup = jest.fn();
jest.mock('./utils', () => ({
  exportConfigSetup: (props: any) => mockExportConfigSetup(props),
}));

const defaultProps = {
  name: 'Test User',
  encryption_secret: 'secret123',
  uuid: 'uuid-1234',
};

describe('SetupGuide', () => {
  test('renders setup guide sections', () => {
    render(<SetupGuide {...defaultProps} />);

    // Section exists
    expect(document.querySelector('#setup-guide')).toBeInTheDocument();

    // Sub-section headings
    expect(screen.getByText('PREREQUISITES')).toBeInTheDocument();
    expect(screen.getByText('CONFIGURATION')).toBeInTheDocument();
    expect(screen.getByText('SYNC')).toBeInTheDocument();
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

  test('clicking download configuration triggers download logic', () => {
    mockExportConfigSetup.mockReturnValue('config-content');

    // Polyfill missing browser APIs
    Object.defineProperty(global.URL, 'createObjectURL', {
      writable: true,
      value: jest.fn(() => 'blob:http://localhost/file'),
    });

    Object.defineProperty(global.URL, 'revokeObjectURL', {
      writable: true,
      value: jest.fn(),
    });

    const appendSpy = jest.spyOn(document.body, 'appendChild');
    const removeSpy = jest.spyOn(document.body, 'removeChild');

    render(<SetupGuide {...defaultProps} />);

    fireEvent.click(screen.getByText(/DOWNLOAD CONFIGURATION/i));

    expect(mockExportConfigSetup).toHaveBeenCalledWith(defaultProps);
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });
});
