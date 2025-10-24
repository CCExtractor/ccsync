import { HighlightLink } from '@/components/ui/link-highlight';
import logo from '../../../assets/logo.png';
import logoLight from '../../../assets/logo_light.png';
import { url } from '@/components/utils/URLs';

export const Footer = () => {
  return (
    <footer id="footer">
      <hr className="w-11/12 mx-auto" />

      <section className="container py-20 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
        <div className="col-span-full xl:col-span-2">
          <a
            rel="noreferrer noopener"
            href="/"
            className="ml-2 font-bold text-xl flex items-center dark:hidden"
          >
            <img
              src={logoLight}
              alt="Logo-light"
              className="h-12 min-h-12 min-w-48 mr-0 mt-2 bg-blend-soft-light"
            />
          </a>
          <a
            rel="noreferrer noopener"
            href="/"
            className="ml-2 font-bold text-xl hidden dark:flex items-center"
          >
            <img
              src={logo}
              alt="Logo"
              className="h-12 min-h-12 min-w-48 mr-0 mt-2 bg-blend-soft-light"
            />
          </a>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">Community</h3>
          <div>
            <HighlightLink rel="noreferrer noopener" href={url.githubRepoURL}>
                          Github
                        </HighlightLink>
          </div>

          <div>
            <HighlightLink rel="noreferrer noopener" href={url.zulipURL}>
              Zulip
            </HighlightLink>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">About</h3>
          <div>
            <HighlightLink rel="noreferrer noopener" href={"#setup-guide"}>
              Setup Guide
            </HighlightLink>
          </div>

          <div>
            <HighlightLink rel="noreferrer noopener" href={"#faq"}>
              FAQ
            </HighlightLink>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">Important Links</h3>
          <div>
            <HighlightLink rel="noreferrer noopener" href={url.taskwarriorURL} target="_blank">
              Taskwarrior
            </HighlightLink>
          </div>

          <div>
             <HighlightLink rel="noreferrer noopener" href={url.taskchampionSyncServerURL} target="_blank">
               Taskchampion-sync-server
            </HighlightLink>
          </div>
        </div>
      </section>

      <section className="container pb-14 text-center">
        <h3>
          &copy; 2024{' '}
          <a
            rel="noreferrer noopener"
            target="_blank"
            className="text-red transition-all border-secondary hover:border-b-2"
          >
            CCSync
          </a>
        </h3>
      </section>
    </footer>
  );
};
