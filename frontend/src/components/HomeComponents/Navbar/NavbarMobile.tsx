import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { url } from '@/components/utils/URLs';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { Menu } from 'lucide-react';
import { ModeToggle } from '../../utils/theme-mode-toggle';
import { buttonVariants } from '@/components/ui/button';
import {
  routeList,
  deleteAllTasks,
  handleLogout,
  RouteProps,
  Props,
} from './navbar-utils';

export const NavbarMobile = (
  props: Props & { setIsOpen: (isOpen: boolean) => void; isOpen: boolean } & {
    isLoading: boolean;
    setIsLoading: (val: boolean) => void;
  }
) => (
  <span className="flex md:hidden">
    <ModeToggle />

    <Sheet open={props.isOpen} onOpenChange={props.setIsOpen}>
      <SheetTrigger className="px-2">
        <Menu
          className="flex md:hidden h-5 w-5"
          onClick={() => props.setIsOpen(true)}
        >
          <span className="sr-only">Menu Icon</span>
        </Menu>
      </SheetTrigger>

      <SheetContent side={'left'}>
        <SheetHeader>
          <SheetTitle className="font-bold text-xl">CCSync</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col justify-center items-center gap-2 mt-4">
          {routeList.map(({ href, label }: RouteProps) => (
            <a
              rel="noreferrer noopener"
              key={label}
              href={href}
              onClick={() => props.setIsOpen(false)}
              className={buttonVariants({ variant: 'ghost' })}
            >
              {label}
            </a>
          ))}
          <a
            rel="noreferrer noopener"
            href={url.githubRepoURL}
            target="_blank"
            className={`w-[110px] border ${buttonVariants({
              variant: 'secondary',
            })}`}
          >
            <GitHubLogoIcon className="mr-2 w-5 h-5" />
            Github
          </a>
          <div
            onClick={() => deleteAllTasks(props)}
            className={`w-[110px] border ${buttonVariants({
              variant: 'destructive',
            })}`}
          >
            Delete All Tasks
          </div>
          <div
            onClick={handleLogout}
            className={`w-[110px] border ${buttonVariants({
              variant: 'destructive',
            })}`}
          >
            Log out
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  </span>
);
