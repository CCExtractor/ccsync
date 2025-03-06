import { Github, LogOut, Trash2, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { ModeToggle } from '../../utils/theme-mode-toggle';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  routeList,
  syncTasksWithTwAndDb,
  deleteAllTasks,
  handleLogout,
  RouteProps,
  Props,
} from './navbar-utils';

export const NavbarDesktop = (
  props: Props & {
    isLoading: boolean;
    setIsLoading: (val: boolean) => void;
  }
) => (
  <div className="hidden md:flex items-center justify-between w-full">
    <nav className="hidden md:flex gap-2 justify-center flex-1">
      {routeList.map((route: RouteProps, i) => (
        <a
          rel="noreferrer noopener"
          href={route.href}
          key={i}
          className={`text-[17px] ${buttonVariants({
            variant: 'ghost',
          })}`}
        >
          {route.label}
        </a>
      ))}
    </nav>
    <div className="hidden md:flex items-center gap-2">
      <Button
        variant={'ghost'}
        className="w-[110px] border"
        onClick={async () => {
          props.setIsLoading(true);
          await syncTasksWithTwAndDb(props);
          props.setIsLoading(false);
        }}
        disabled={props.isLoading}
      >
        {props.isLoading ? (
          <>
            <Loader2 className="mr-2 size-5 animate-spin" />
            Syncing
          </>
        ) : (
          'Sync Tasks'
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar>
            <AvatarImage src={props.imgurl} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>{props.email}</DropdownMenuLabel>
          <DropdownMenuItem
            className="text-red-500"
            onClick={() => deleteAllTasks(props)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete all tasks
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Github className="mr-2 h-4 w-4" />
            <span>GitHub</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <div onClick={handleLogout}>Log out</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ModeToggle />
    </div>
  </div>
);
