import { render, screen } from '@testing-library/react';
import { SetupGuide } from '../SetupGuide';
import { Props } from '../../../utils/types';
import { url } from '@/components/utils/URLs';

// Mocking the CopyableCode component
jest.mock('../CopyableCode', () => ({
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
      data-issensitive={isSensitive}
    >
      {text}
    </div>
  ),
}));

describe('SetupGuide Component', () => {
  const props: Props = {
    name: 'test-name',
    encryption_secret: 'test-encryption-secret',
    uuid: 'test-uuid',
  };

  test('renders SetupGuide component with correct text', () => {
    render(<SetupGuide {...props} />);
  });

  test('renders CopyableCode components with correct props', () => {
    render(<SetupGuide {...props} />);

    // Check for CopyableCode components
    const copyableCodeElements = screen.getAllByTestId('copyable-code');
    expect(copyableCodeElements.length).toBe(5);

    // Validate the text and copyText props of each CopyableCode component
    expect(copyableCodeElements[0]).toHaveAttribute(
      'data-text',
      'task --version'
    );
    expect(copyableCodeElements[0]).toHaveAttribute(
      'data-copytext',
      'task --version'
    );
    expect(copyableCodeElements[1]).toHaveAttribute(
      'data-text',
      `task config sync.encryption_secret ${props.encryption_secret}`
    );
    expect(copyableCodeElements[1]).toHaveAttribute(
      'data-copytext',
      `task config sync.encryption_secret ${props.encryption_secret}`
    );
    expect(copyableCodeElements[2]).toHaveAttribute(
      'data-text',
      `task config sync.server.origin ${url.containerOrigin}`
    );
    expect(copyableCodeElements[2]).toHaveAttribute(
      'data-copytext',
      `task config sync.server.origin ${url.containerOrigin}`
    );
    expect(copyableCodeElements[3]).toHaveAttribute(
      'data-text',
      `task config sync.server.client_id ${props.uuid}`
    );
    expect(copyableCodeElements[3]).toHaveAttribute(
      'data-copytext',
      `task config sync.server.client_id ${props.uuid}`
    );
  });
});
