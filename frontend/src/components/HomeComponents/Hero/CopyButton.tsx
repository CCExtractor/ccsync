import { CopyToClipboard } from 'react-copy-to-clipboard';
import { CopyIcon } from 'lucide-react';
import { showToast } from './ToastNotification';
import { CopyButtonProps } from '@/components/utils/types';

export const CopyButton = ({ text, label }: CopyButtonProps) => (
  <CopyToClipboard text={text} onCopy={() => showToast(label)}>
    <button className="bg-blue-500 hover:bg-gray-900 text-white font-bold py-3 md:py-4 px-3 md:px-4 rounded ml-2">
      <CopyIcon />
    </button>
  </CopyToClipboard>
);
