import { Props } from '../../utils/types';
import { CopyButton } from './CopyButton';
import { ToastNotification } from './ToastNotification';

export const Hero = (props: Props) => {
  return (
    <section id="#" className="container py-20 md:py-32">
      <div className="text-center lg:text-start space-y-6">
        <main className="text-5xl md:text-6xl font-bold">
          <h1 className="inline">
            <span className="inline bg-gradient-to-r from-[#61DAFB] to-[#1fc0f1] text-transparent bg-clip-text">
              Welcome,
            </span>{' '}
          </h1>
          <h2 className="inline">
            <span className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
              {props.name}!
            </span>
          </h2>
        </main>

        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
          Follow the guide below to setup sync for your Taskwarrior clients
        </p>

        <div>
          <h3 className="text-3xl text-foreground font-semibold mb-3">
            Here are your credentials
          </h3>
          <p className="text-lg text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
            You may use your own as well, but make sure to use the same
            credentials on each client.
            <br></br> Also, the tasks won't be stored on our database if you do
            so.
          </p>
          <br></br>

          <h3 className="text-xl text-foreground font-semibold">UUID</h3>
          <div className="mt-4 flex items-center">
            <div className="bg-gray-900 text-white p-4 rounded-lg relative flex-grow-1 overflow-x-auto">
              <code className="whitespace-nowrap">{props.uuid}</code>
            </div>
            <CopyButton text={props.uuid} label="UUID" />
          </div>
          <br></br>

          <h3 className="text-xl text-foreground font-semibold">
            Encryption Secret
          </h3>
          <div className="mt-4 flex items-center">
            <div className="bg-gray-900 text-white p-4 rounded-lg relative flex-grow-1 overflow-x-auto">
              <code className="whitespace-nowrap">
                {props.encryption_secret}
              </code>
            </div>
            <CopyButton
              text={props.encryption_secret}
              label="Encryption Secret"
            />
          </div>
        </div>
      </div>

      {/* Shadow effect */}
      <div className="shadow"></div>

      <ToastNotification />
    </section>
  );
};
