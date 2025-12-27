import { exportConfigSetup } from '../utils';
import { Props } from '@/components/utils/types';
import { url } from '@/components/utils/URLs';

describe('exportConfigSetup', () => {
  const mockProps: Props = {
    name: 'Test User',
    encryption_secret: 'test-secret-123',
    uuid: 'test-uuid-456',
  };

  it('should generate configuration content with all required fields', () => {
    const result = exportConfigSetup(mockProps);

    expect(result).toContain('Configure Taskwarrior with these commands');
    expect(result).toContain(
      `task config sync.encryption_secret ${mockProps.encryption_secret}`
    );
    expect(result).toContain(
      `task config sync.server.origin ${url.containerOrigin}`
    );
    expect(result).toContain(
      `task config sync.server.client_id ${mockProps.uuid}`
    );
    expect(result).toContain('task-sync(5) manpage');
  });

  it('should join all lines with newline characters', () => {
    const result = exportConfigSetup(mockProps);
    const lines = result.split('\n');

    expect(lines.length).toBeGreaterThan(1);
    expect(result).toMatch(/\n/);
  });

  it('should include encryption secret in the output', () => {
    const result = exportConfigSetup(mockProps);

    expect(result).toContain(mockProps.encryption_secret);
  });

  it('should include UUID in the output', () => {
    const result = exportConfigSetup(mockProps);

    expect(result).toContain(mockProps.uuid);
  });

  it('should include container origin URL in the output', () => {
    const result = exportConfigSetup(mockProps);

    expect(result).toContain(url.containerOrigin);
  });
});
