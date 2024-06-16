import { CopyToClipboard } from 'react-copy-to-clipboard';
import { CopyIcon } from 'lucide-react';
import { showToast } from './ToastNotification';

interface CopyButtonProps {
  text: string;
  label: string;
}

export const CopyButton = ({ text, label }: CopyButtonProps) => (
  <CopyToClipboard text={text} onCopy={() => showToast(label)}>
    <button className="bg-blue-500 hover:bg-gray-900 text-white font-bold py-4 px-2 rounded ml-2">
      <CopyIcon />
    </button>
  </CopyToClipboard>
);
