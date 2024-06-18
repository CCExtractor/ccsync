import { url } from "@/lib/URLs";
import { Props } from "../../utils/types";
import { CopyableCode } from "./CopyableCode";

export const SetupGuide = (props: Props) => {
  return (
    <section id="setup-guide" className="container py-24 pl-1 pr-1 md:pr-4 md:pl-4 sm:py-32">
      <h2 className="text-3xl md:text-4xl font-bold text-center">
        <span className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
          Setup{" "}
        </span>
        Guide
      </h2>
      <div className="bg-muted/50 border mt-10 rounded-lg py-12">
        <div className="px-6 flex flex-col-reverse md:flex-row gap-8 md:gap-12">
          <div className="bg-green-0 flex flex-col justify-between">
            <div className="pb-6">
              <h3 className="text-2xl mt-0 md:text-2xl font-bold">
                <span className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
                  1.{" "}
                </span>
                PREREQUISITES
              </h3>
              <div className="text-xl ml-5 text-muted-foreground mt-10 mb-5">
                Ensure that Taskwarrior 3.0 or greater is installed on your system
                <CopyableCode text={"task --version"} copyText={"task --version"} />
              </div>

              <h3 className="text-2xl mt-10 md:text-2xl font-bold">
                <span className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
                  2.{" "}
                </span>
                CONFIGURATION
              </h3>
              <div className="text-xl ml-5 text-muted-foreground mt-10 mb-5">
                You will need an encryption secret used to encrypt and decrypt your tasks. This
                can be any secret string, and must match for all replicas sharing tasks.
                For most of these, you will need an encryption secret used to encrypt and decrypt your tasks.
                <CopyableCode text={`task config sync.encryption_secret ${props.encryption_secret}`} copyText={`task config sync.encryption_secret ${props.encryption_secret}`} />

                <br />
                Configure Taskwarrior with these commands, run these commands one block at a time

                {/* Link to container */}
                <CopyableCode text={`task config sync.server.origin ${url.containerOrigin}`} copyText={`task config sync.server.origin ${url.containerOrigin}`} />

                {/* Client ID */}
                <CopyableCode text={`task config sync.server.client_id ${props.uuid}`} copyText={`task config sync.server.client_id ${props.uuid}`} />

                <br />
                For more information about how this works, refer to the <b>task-sync(5)</b> manpage for details on how to configure the new sync implementation.
              </div>

              <h3 className="text-2xl mt-10 md:text-2xl font-bold">
                <span className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
                  3.{" "}
                </span>
                SYNC
              </h3>
              <div className="text-xl ml-5 text-muted-foreground mt-10 mb-5">
                Finally, setup the sync for your Taskwarrior client!
                <CopyableCode text={"task sync init"} copyText={"task sync init"} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
