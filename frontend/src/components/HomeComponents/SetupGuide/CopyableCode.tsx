import { CopyIcon, Eye, EyeOff } from 'lucide-react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { toast } from 'react-toastify';
import { useState } from 'react';

interface CopyableCodeProps {
  text: string;
  copyText: string;
  isSensitive?: boolean;
}

export const CopyableCode = ({
  text,
  copyText,
  isSensitive = false,
}: CopyableCodeProps) => {
  const [showSensitive, setShowSensitive] = useState(true);

  const handleCopy = (text: string) => {
    toast.success(`${text} copied to clipboard!`, {
      position: 'bottom-left',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const maskSensitiveValue = (fullText: string) => {
    const parts = fullText.split(' ');
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      const maskedValue = '•'.repeat(lastPart.length);
      parts[parts.length - 1] = maskedValue;
      return parts.join(' ');
    }
    return fullText;
  };

  const displayText =
    isSensitive && !showSensitive ? maskSensitiveValue(text) : text;

  return (
    <div className="mt-4 flex items-center gap-2 w-full">
      <div className="bg-gray-900 text-white p-3 sm:p-4 rounded-lg flex-grow overflow-x-auto">
        <code className="text-sm sm:text-base whitespace-nowrap break-all">
          {displayText}
        </code>
      </div>
      {isSensitive && (
        <button
          onClick={() => setShowSensitive(!showSensitive)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-3 sm:p-4 rounded flex-shrink-0"
          aria-label={
            showSensitive ? 'Hide sensitive value' : 'Show sensitive value'
          }
        >
          {showSensitive ? (
            <EyeOff className="size-5" />
          ) : (
            <Eye className="size-5" />
          )}
        </button>
      )}
      <CopyToClipboard text={copyText} onCopy={() => handleCopy(copyText)}>
        <button className="bg-blue-500 hover:bg-gray-900 text-white font-bold p-3 sm:p-4 rounded flex-shrink-0">
          <CopyIcon className="size-5" />
        </button>
      </CopyToClipboard>
    </div>
  );
};