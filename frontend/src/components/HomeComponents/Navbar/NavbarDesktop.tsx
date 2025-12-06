import {
  Github,
  LogOut,
  Trash2,
  FileDown,
  FileText,
  FileJson,
  Terminal,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { ModeToggle } from '../../utils/ThemeModeToggle';
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
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { url } from '@/components/utils/URLs';
import {
  exportTasksAsJSON,
  exportTasksAsTXT,
} from '@/components/utils/ExportTasks';
import { useState } from 'react';
import { DevLogs } from '../DevLogs/DevLogs';
import { useTaskAutoSync } from '@/components/utils/TaskAutoSync';
import { Label } from '@/components/ui/label';

export const NavbarDesktop = (
  props: Props & {
    isLoading: boolean;
    setIsLoading: (val: boolean) => void;
  }
) => {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isDevLogsOpen, setIsDevLogsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [autoSyncEnable, setAutoSyncEnable] = useState(false);
  const [syncInterval, setSyncInterval] = useState(1);
  useTaskAutoSync({
    isLoading: props.isLoading,
    setIsLoading: props.setIsLoading,
    isAutoSyncEnabled: autoSyncEnable,
    syncInterval: syncInterval * 60000,
  });

  const handleExportJSON = () => {
    exportTasksAsJSON(props.tasks || []);
    setIsExportDialogOpen(false);
  };

  const handleExportTXT = () => {
    exportTasksAsTXT(props.tasks || []);
    setIsExportDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    deleteAllTasks(props);
    setIsDeleteConfirmOpen(false);
  };

  return (
    <>
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
              <Dialog
                open={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
              >
                <DialogTrigger>
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete all tasks
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogDescription className="text-lg font-semibold text-red-600">
                      Delete All Tasks?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-base mb-2">
                      Are you sure you want to delete all tasks for{' '}
                      <span className="font-semibold">{props.email}</span>?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This action cannot be undone. All your tasks will be
                      permanently deleted from the local database.
                    </p>
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteConfirmOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteConfirm}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete All Tasks
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isDevLogsOpen} onOpenChange={setIsDevLogsOpen}>
                <DialogTrigger>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Terminal className="mr-2 h-4 w-4" />
                    <span>Developer Logs</span>
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Developer Logs</DialogTitle>
                    <DialogDescription>
                      View sync operation logs with timestamps and status
                      information.
                    </DialogDescription>
                  </DialogHeader>
                  <DevLogs isOpen={isDevLogsOpen} />
                </DialogContent>
              </Dialog>
              <DropdownMenuItem
                onClick={() => window.open(url.githubRepoURL, '_blank')}
              >
                <Github className="mr-2 h-4 w-4" />
                <span>GitHub</span>
              </DropdownMenuItem>
              <Dialog
                open={isExportDialogOpen}
                onOpenChange={setIsExportDialogOpen}
              >
                <DialogTrigger>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <FileDown className="mr-2 h-4 w-4" />
                    <span>Export tasks</span>
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogDescription>
                      Would you like to download your tasks as a JSON file or a
                      TXT file?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-4 mt-4">
                    <Button
                      className="bg-[#3B82F6] hover:bg-[#3B82F6] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                      onClick={handleExportTXT}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Download .txt
                    </Button>
                    <Button
                      className="bg-[#3B82F6]  hover:bg-[#3B82F6]"
                      onClick={handleExportJSON}
                    >
                      <FileJson className="mr-2 h-4 w-4" />
                      Download .json
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <div className="flex flex-col space-y-3 p-1 w-full">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="autosync-switch">Auto sync tasks</Label>
                    <Switch
                      id="autosync-switch"
                      checked={autoSyncEnable}
                      onCheckedChange={setAutoSyncEnable}
                    />
                  </div>
                  {autoSyncEnable && (
                    <div className="flex flex-col space-y-2 pt-2">
                      <Label htmlFor="sync-slider" className="text-sm">
                        Sync every {syncInterval} minutes
                      </Label>
                      <Slider
                        id="sync-slider"
                        min={1}
                        max={10}
                        step={1}
                        value={[syncInterval]}
                        onValueChange={(value) => setSyncInterval(value[0])}
                      />
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ModeToggle />
        </div>
      </div>
    </>
  );
};
