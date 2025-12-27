import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { url } from '@/components/utils/URLs';
import {
  Menu,
  Github,
  LogOut,
  Trash2,
  FileDown,
  FileJson,
  FileText,
  Terminal,
} from 'lucide-react';
import { ModeToggle } from '../../utils/ThemeModeToggle';
import { buttonVariants } from '@/components/ui/button';
import {
  routeList,
  deleteAllTasks,
  handleLogout,
  RouteProps,
  Props,
} from '@/components/HomeComponents/Navbar/navbar-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  exportTasksAsJSON,
  exportTasksAsTXT,
} from '@/components/utils/ExportTasks';
import { DevLogs } from '../DevLogs/DevLogs';
import { useTaskAutoSync } from '@/components/utils/TaskAutoSync';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

export const NavbarMobile = (
  props: Props & { setIsOpen: (isOpen: boolean) => void; isOpen: boolean } & {
    isLoading: boolean;
    setIsLoading: (val: boolean) => void;
  }
) => {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isAutoSyncDialogOpen, setIsAutoSyncDialogOpen] = useState(false);
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
    props.setIsOpen(false);
  };

  const handleExportTXT = () => {
    exportTasksAsTXT(props.tasks || []);
    setIsExportDialogOpen(false);
    props.setIsOpen(false);
  };

  const handleDeleteConfirm = () => {
    deleteAllTasks(props);
    setIsDeleteConfirmOpen(false);
    props.setIsOpen(false);
  };

  return (
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
            <SheetDescription>
              Mobile navigation menu for CCSync
            </SheetDescription>
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
              className={`w-[130px] border ${buttonVariants({
                variant: 'secondary',
              })}`}
            >
              <Github className="mr-2 w-5 h-5" />
              Github
            </a>

            <Dialog
              open={isExportDialogOpen}
              onOpenChange={setIsExportDialogOpen}
            >
              <DialogTrigger asChild>
                <div
                  className={`w-[130px] cursor-pointer border ${buttonVariants({
                    variant: 'secondary',
                  })}`}
                >
                  <FileDown />
                  Export Tasks
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Choose Export Format</DialogTitle>
                  <DialogDescription>
                    Would you like to download your tasks as a JSON file or a
                    TXT file?
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                  <Button
                    onClick={handleExportTXT}
                    className="w-full sm:w-auto hover:bg-white bg-[#3B82F6]"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Download .txt
                  </Button>
                  <Button
                    onClick={handleExportJSON}
                    className="w-full sm:w-auto hover:bg-white bg-[#3B82F6]"
                  >
                    <FileJson className="mr-2 h-4 w-4" />
                    Download .json
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog
              open={isAutoSyncDialogOpen}
              onOpenChange={setIsAutoSyncDialogOpen}
            >
              <DialogTrigger asChild>
                <div
                  className={`w-[130px] cursor-pointer border ${buttonVariants({
                    variant: 'secondary',
                  })}`}
                >
                  Auto-sync
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Auto Sync</DialogTitle>
                  <DialogDescription>
                    Enable or disable automatic task synchronization and
                    configure the sync interval.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col space-y-4 pt-2">
                  <div className="flex mt-2 items-center justify-between space-x-2">
                    <Label htmlFor="autosync-switch" className="text-base">
                      Enable Auto-Sync
                    </Label>
                    <Switch
                      id="autosync-switch"
                      checked={autoSyncEnable}
                      onCheckedChange={setAutoSyncEnable}
                    />
                  </div>

                  {autoSyncEnable && (
                    <div className="flex flex-col space-y-3 pt-2">
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
              </DialogContent>
            </Dialog>
            <Dialog open={isDevLogsOpen} onOpenChange={setIsDevLogsOpen}>
              <DialogTrigger>
                <div
                  // onClick={() => {
                  //   setIsDevLogsOpen(true);
                  //   props.setIsOpen(false);
                  // }}
                  className={`w-[130px] cursor-pointer border ${buttonVariants({
                    variant: 'secondary',
                  })}`}
                >
                  <Terminal className="mr-2 w-5 h-5" />
                  Developer Logs
                </div>
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
            <div
              onClick={() => setIsDeleteConfirmOpen(true)}
              className={`w-[130px] cursor-pointer border ${buttonVariants({
                variant: 'destructive',
              })}`}
            >
              <Trash2 className="mr-2 w-5 h-5" />
              Delete All Tasks
            </div>
            <div
              onClick={handleLogout}
              className={`w-[130px] border ${buttonVariants({
                variant: 'destructive',
              })}`}
            >
              <LogOut className="mr-2 w-5 h-5" />
              Log out
            </div>
          </nav>
        </SheetContent>
      </Sheet>
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-red-600">
              Delete All Tasks?
            </DialogTitle>
            <DialogDescription>This action cannot be undone</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base mb-2">
              Are you sure you want to delete all tasks for{' '}
              <span className="font-semibold">{props.email}</span>?
            </p>
            <p className="text-sm text-muted-foreground">
              All your tasks will be permanently deleted from the local
              database.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete All Tasks
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </span>
  );
};
