import { url } from '@/components/utils/URLs';
import { Props } from '../../utils/types';
import { CopyableCode } from './CopyableCode';

export const SetupGuide = (props: Props) => {
  return (
    <section
      id="setup-guide"
      className="container mx-auto px-4 py-12 sm:py-24 md:py-32 max-w-7xl"
    >
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">
        <span className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
          Setup{' '}
        </span>
        Guide
      </h2>
      <div className="bg-muted/50 border mt-6 sm:mt-8 md:mt-10 rounded-lg py-8 sm:py-10 md:py-12 px-none sm:px-6 md:px-8 xl:px-12">
        <div className="px-4 sm:px-6 flex flex-col-reverse md:flex-row gap-6 sm:gap-8 md:gap-12">
          <div className="w-full flex flex-col justify-between">
            <div className="space-y-6 sm:space-y-8 md:space-y-10">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">
                  <span className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
                    1.{' '}
                  </span>
                  PREREQUISITES
                </h3>
                <div className="text-base sm:text-lg md:text-xl text-muted-foreground mt-4 sm:mt-6 md:mt-8">
                  Ensure that Taskwarrior 3.0 or greater is installed on your
                  system
                  <CopyableCode
                    text={'task --version'}
                    copyText={'task --version'}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold">
                  <span className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
                    2.{' '}
                  </span>
                  CONFIGURATION
                </h3>
                <div className="text-base sm:text-lg md:text-xl text-muted-foreground mt-4 sm:mt-6 md:mt-8">
                  You will need an encryption secret used to encrypt and decrypt
                  your tasks. This can be any secret string, and must match for
                  all replicas sharing tasks. For most of these, you will need
                  an encryption secret used to encrypt and decrypt your tasks.
                  <CopyableCode
                    text={`task config sync.encryption_secret ${props.encryption_secret}`}
                    copyText={`task config sync.encryption_secret ${props.encryption_secret}`}
                  />
                  <div className="my-4">
                    Configure Taskwarrior with these commands, run these
                    commands one block at a time
                  </div>
                  {/* Link to container */}
                  <CopyableCode
                    text={`task config sync.server.origin ${url.containerOrigin}`}
                    copyText={`task config sync.server.origin ${url.containerOrigin}`}
                  />
                  {/* Client ID */}
                  <CopyableCode
                    text={`task config sync.server.client_id ${props.uuid}`}
                    copyText={`task config sync.server.client_id ${props.uuid}`}
                  />
                  <div className="mt-4">
                    For more information about how this works, refer to the{' '}
                    <b>task-sync(5)</b> manpage for details on how to configure
                    the new sync implementation.
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold">
                  <span className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
                    3.{' '}
                  </span>
                  SYNC
                </h3>
                <div className="text-base sm:text-lg md:text-xl text-muted-foreground mt-4 sm:mt-6 md:mt-8">
                  Finally, setup the sync for your Taskwarrior client!
                  <CopyableCode
                    text={'task sync init'}
                    copyText={'task sync init'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
