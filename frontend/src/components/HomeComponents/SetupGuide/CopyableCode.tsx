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
    <div className="mt-4 flex items-center">
      <div className="bg-gray-900 text-white p-4 rounded-lg relative flex-grow-1 overflow-x-auto">
        <code className="whitespace-nowrap">{text}</code>
      </div>
      <CopyToClipboard text={copyText} onCopy={() => handleCopy(copyText)}>
        <button className="bg-blue-500 hover:bg-gray-900 text-white font-bold py-4 px-2 rounded ml-2">
          <CopyIcon />
        </button>
      </CopyToClipboard>
    </div>
  );
};
