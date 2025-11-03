import {
  Github,
  LogOut,
  Trash2,
  FileDown,
  FileText,
  FileJson,
  Terminal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { ModeToggle } from '../../utils/theme-mode-toggle';
import { buttonVariants } from '@/components/ui/button';
import {
  routeList,
  deleteAllTasks,
  handleLogout,
  RouteProps,
  Props,
} from './navbar-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { url } from '@/components/utils/URLs';
import { exportTasksAsJSON, exportTasksAsTXT } from '@/exports-tasks';
import { useState } from 'react';
import { DevLogs } from '../DevLogs/DevLogs';

export const NavbarDesktop = (
  props: Props & {
    isLoading: boolean;
    setIsLoading: (val: boolean) => void;
  }
) => {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isDevLogsOpen, setIsDevLogsOpen] = useState(false);

  const handleExportJSON = () => {
    exportTasksAsJSON(props.tasks || []);
    setIsExportDialogOpen(false);
  };

  const handleExportTXT = () => {
    exportTasksAsTXT(props.tasks || []);
    setIsExportDialogOpen(false);
  };

  return (
    <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
      <div className="hidden md:flex items-center justify-between w-full">
        <nav className="hidden md:flex gap-2 justify-center flex-1">
          {routeList.map((route: RouteProps, i) => (
            <a
              rel="noreferrer noopener"
              href={route.href}
              key={i}
              className={`text-[17px] ${buttonVariants({ variant: 'ghost' })}`}
            >
              {route.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
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
              <DropdownMenuItem onClick={() => setIsDevLogsOpen(true)}>
                <Terminal className="mr-2 h-4 w-4" />
                <span>Developer Logs</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(url.githubRepoURL, '_blank')}
              >
                <Github className="mr-2 h-4 w-4" />
                <span>GitHub</span>
              </DropdownMenuItem>
              <DialogTrigger>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <FileDown className="mr-2 h-4 w-4" />
                  <span>Export tasks</span>
                </DropdownMenuItem>
              </DialogTrigger>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ModeToggle />
        </div>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogDescription>
            Would you like to download your tasks as a JSON file or a TXT file?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-4 mt-4">
          <Button
            className="bg-[#3B82F6] hover:bg-white focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
            onClick={handleExportTXT}
          >
            <FileText className="mr-2 h-4 w-4" />
            Download .txt
          </Button>
          <Button
            className="bg-[#3B82F6]  hover:bg-white"
            onClick={handleExportJSON}
          >
            <FileJson className="mr-2 h-4 w-4" />
            Download .json
          </Button>
        </div>
      </DialogContent>
      <DevLogs isOpen={isDevLogsOpen} onOpenChange={setIsDevLogsOpen} />
    </Dialog>
  );
};
