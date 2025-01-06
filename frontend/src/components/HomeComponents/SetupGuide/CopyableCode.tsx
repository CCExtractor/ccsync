import { CopyIcon } from "lucide-react";
import CopyToClipboard from "react-copy-to-clipboard";
import { toast } from "react-toastify";

interface CopyableCodeProps {
  text: string;
  copyText: string;
}

export const CopyableCode = ({ text, copyText }: CopyableCodeProps) => {
  const handleCopy = (text: string) => {
    toast.success(`${text} copied to clipboard!`, {
      position: "bottom-left",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  return (
    <div className="mt-4 flex items-center gap-2 w-full">
      <div className="bg-gray-900 text-white p-3 sm:p-4 rounded-lg flex-grow overflow-x-auto">
        <code className="text-sm sm:text-base whitespace-nowrap break-all">{text}</code>
      </div>
      <CopyToClipboard text={copyText} onCopy={() => handleCopy(copyText)}>
        <button className="bg-blue-500 hover:bg-gray-900 text-white font-bold p-3 sm:p-4 rounded flex-shrink-0">
          <CopyIcon className="size-5" />
        </button>
      </CopyToClipboard>
    </div>
  );
};
