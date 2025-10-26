import { Props } from '../../utils/types';
import { ToastNotification } from './ToastNotification';
import { CopyableCode } from '../SetupGuide/CopyableCode';

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
          <div className="mt-4">
            <CopyableCode
              text={props.uuid}
              copyText={props.uuid}
              sensitiveValue={props.uuid}
              sensitiveValueType="UUID"
              className="w-auto max-w-3xl"
            />
          </div>
          <br></br>

          <h3 className="text-xl text-foreground font-semibold">
            Encryption Secret
          </h3>
          <div className="mt-4">
            <CopyableCode
              text={props.encryption_secret}
              copyText={props.encryption_secret}
              sensitiveValue={props.encryption_secret}
              sensitiveValueType="Encryption Secret"
              className="w-auto max-w-3xl"
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
