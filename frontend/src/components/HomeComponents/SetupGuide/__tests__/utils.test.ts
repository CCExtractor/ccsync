import { url } from '@/components/utils/URLs';
import { exportConfigSetup } from '../utils';

describe('exportConfigSetup', () => {
  test('generate correct configuration setup', () => {
    const props = {
      encryption_secret: 'encryptionSecret',
      uuid: 'clients-uuid',
    } as any;

    const result = exportConfigSetup(props);

    expect(result).toContain(
      'Configure Taskwarrior with these commands, run these commands one block at a time'
    );

    expect(result).toContain(
      `task config sync.encryption_secret ${props.encryption_secret}`
    );

    expect(result).toContain(
      `task config sync.server.url ${url.containerOrigin}`
    );

    expect(result).toContain(`task config sync.server.client_id ${props.uuid}`);
  });

  test('returns string seprated with newline', () => {
    const props = {
      encryption_secret: 'encryptionSecret',
      uuid: 'clients-uuid',
    } as any;

    const result = exportConfigSetup(props);

    const lines = result.split('\n');
    expect(lines.length).toBeGreaterThan(1);
  });
});
