import { Props } from '@/components/utils/types';
import { url } from '@/components/utils/URLs';

export function exportConfigSetup(props: Props): string {
  return [
    'Configure Taskwarrior with these commands, run these commands one block at a time',
    `task config sync.encryption_secret ${props.encryption_secret}`,
    `task config sync.server.origin ${url.containerOrigin}`,
    `task config sync.server.client_id ${props.uuid}`,
    'For more information about how this works, refer to the task-sync(5) manpage for details on how to configure the new sync implementation.',
  ].join('\n');
}
