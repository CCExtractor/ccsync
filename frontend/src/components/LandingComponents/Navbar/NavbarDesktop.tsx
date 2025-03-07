import { Button, buttonVariants } from '../../ui/button';
import { ModeToggle } from '../../utils/theme-mode-toggle';
import { routeList } from './navbar-utils';

export const NavbarDesktop = () => {
  return (
    <>
      <nav className="hidden md:flex gap-2 justify-center flex-1 mr-20">
        {routeList.map(({ href, label }, i) => (
          <a
            rel="noreferrer noopener"
            href={href}
            key={i}
            className={`text-[17px] ${buttonVariants({ variant: 'ghost' })}`}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="pl-20 hidden md:flex gap-2">
        <ModeToggle />
      </div>
      <a target="_blank" href="https://its-me-abhishek.github.io/ccsync-docs/">
        <div className="hidden md:flex">
          <Button variant={'outline'}>Docs</Button>
        </div>
      </a>
    </>
  );
};
