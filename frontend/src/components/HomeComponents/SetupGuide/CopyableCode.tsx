import { CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import CopyToClipboard from 'react-copy-to-clipboard';
import { toast } from 'react-toastify';

interface CopyableCodeProps {
  text: string;
  copyText: string;
  sensitiveValue?: string;
  sensitiveValueType?: string;
  className?: string;
}

export const CopyableCode = ({
  text,
  copyText,
  sensitiveValue,
  sensitiveValueType,
  className = '',
}: CopyableCodeProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

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

  const displayText = isVisible || !sensitiveValue
      ? text
      : text.replace(sensitiveValue,'••••••••••••••••••••••••••••••••••••••••' );

  return (
    <div className={`mt-4 flex items-center gap-2 w-full ${className}`}>
      <div className="bg-gray-900 text-white p-3 sm:p-4 rounded-lg flex-grow overflow-x-auto">
        <code className="text-sm sm:text-base whitespace-nowrap break-all">
          {displayText}
        </code>
      </div>
      {sensitiveValue && (
        <button
          onClick={toggleVisibility}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold p-3 sm:p-4 rounded flex-shrink-0"
          title={
            isVisible
              ? `Hide ${sensitiveValueType}`
              : `Show ${sensitiveValueType}`
          }
        >
          {isVisible ? (
            <FaEyeSlash className="size-5" />
          ) : (
            <FaEye className="size-5" />
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
