import { CopyIcon } from "lucide-react";
import CopyToClipboard from "react-copy-to-clipboard";
import { toast } from "react-toastify";
import { Props } from "../types";

export const SetupGuide = (props: Props) => {
    const containerOrigin = import.meta.env.VITE_CONATINER_ORIGIN;

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
        <section id="setup-guide" className="container py-24 sm:py-32">
            <h2 className="text-3xl md:text-4xl font-bold text-center">
                <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                    Setup{" "}
                </span>
                Guide
            </h2>
            <div className="bg-muted/50 border mt-10 rounded-lg py-12">
                <div className="px-6 flex flex-col-reverse md:flex-row gap-8 md:gap-12">
                    <div className="bg-green-0 flex flex-col justify-between">
                        <div className="pb-6">
                            <h3 className="text-2xl mt-0 md:text-2xl font-bold">
                                <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                    1.{" "}
                                </span>
                                PREREQUISITES
                            </h3>
                            <div className="text-xl ml-5 text-muted-foreground mt-10 mb-5">
                                Ensure that Taskwarrior 3.0 or greater is installed on your system
                                <div className="mt-4 flex items-center">
                                    <div className="bg-gray-900 text-white p-4 rounded-lg relative flex-grow-1 overflow-x-auto">
                                        <code className="whitespace-nowrap">{"task --version"}</code>
                                    </div>
                                    <CopyToClipboard text={"task --version"} onCopy={() => handleCopy('Text')}>
                                        <button className="bg-blue-500 hover:bg-gray-900 text-white font-bold py-4 px-2 rounded ml-2">
                                            <CopyIcon />
                                        </button>
                                    </CopyToClipboard>
                                </div>
                            </div>

                            <h3 className="text-2xl mt-10 md:text-2xl font-bold">
                                <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                    2.{" "}
                                </span>
                                CONFIGURATION
                            </h3>
                            <div className="text-xl ml-5 text-muted-foreground mt-10 mb-5">
                                You will need an encryption secret used to encrypt and decrypt your tasks. This
                                can be any secret string, and must match for all replicas sharing tasks.
                                For  most  of these, you will need an encryption secret used to encrypt and decrypt your tasks.

                                <div className="mt-4 flex items-center">
                                    <div className="bg-gray-900 text-white p-4 rounded-lg relative flex-grow-1 overflow-x-auto">
                                        <code className="whitespace-nowrap">{"task config sync.encryption_secret " + props.encryption_secret}</code>
                                    </div>
                                    <CopyToClipboard text={"task config sync.encryption_secret " + props.encryption_secret} onCopy={() => handleCopy('Text')}>
                                        <button className="bg-blue-500 hover:bg-gray-900 text-white font-bold py-4 px-2 rounded ml-2">
                                            <CopyIcon />
                                        </button>
                                    </CopyToClipboard>
                                </div>
                                <br></br>
                                Configure Taskwarrior with these commands, run these commands one block at a time

                                {/*Link to container*/}
                                <div className="mt-4 flex items-center">
                                    <div className="bg-gray-900 text-white p-4 rounded-lg relative flex-grow-1 overflow-x-auto">
                                        <code className="whitespace-nowrap">{"task config sync.server.origin " + containerOrigin}</code>
                                    </div>
                                    <CopyToClipboard text={"task config sync.server.origin " + containerOrigin} onCopy={() => handleCopy('Text')}>
                                        <button className="bg-blue-500 hover:bg-gray-900 text-white font-bold py-4 px-2 rounded ml-2">
                                            <CopyIcon />
                                        </button>
                                    </CopyToClipboard>
                                </div>

                                {/*Client ID*/}
                                <div className="mt-4 flex items-center">
                                    <div className="bg-gray-900 text-white p-4 rounded-lg relative flex-grow-1 overflow-x-auto">
                                        <code className="whitespace-nowrap">{"task config sync.server.client_id " + props.uuid}</code>
                                    </div>
                                    <CopyToClipboard text={"task config sync.server.client_id " + props.uuid} onCopy={() => handleCopy('Text')}>
                                        <button className="bg-blue-500 hover:bg-gray-900 text-white font-bold py-4 px-2 rounded ml-2">
                                            <CopyIcon />
                                        </button>
                                    </CopyToClipboard>
                                </div>
                                <br></br>
                                For more information about how this works, refer to the <b>task-sync(5)</b> manpage for details on how to configure the new sync implementation.
                            </div>


                            <h3 className="text-2xl mt-10 md:text-2xl font-bold">
                                <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
                                    3.{" "}
                                </span>
                                SYNC
                            </h3>
                            <div className="text-xl ml-5 text-muted-foreground mt-10 mb-5">
                                Finally, setup the sync for your Taskwarrior client!
                                <div className="mt-5 flex items-center">
                                    <div className="bg-gray-900 text-white p-4 rounded-lg relative flex-grow-1 overflow-x-auto">
                                        <code className="whitespace-nowrap">{"task sync init"}</code>
                                    </div>
                                    <CopyToClipboard text={"task sync init"} onCopy={() => handleCopy('Text')}>
                                        <button className="bg-blue-500 hover:bg-gray-900 text-white font-bold py-4 px-2 rounded ml-2">
                                            <CopyIcon />
                                        </button>
                                    </CopyToClipboard>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
