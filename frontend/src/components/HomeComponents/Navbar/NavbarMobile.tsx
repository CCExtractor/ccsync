import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
} from 'lucide-react';
import { ModeToggle } from '../../utils/theme-mode-toggle';
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
import { exportTasksAsJSON, exportTasksAsTXT } from '@/exports-tasks';

export const NavbarMobile = (
  props: Props & { setIsOpen: (isOpen: boolean) => void; isOpen: boolean } & {
    isLoading: boolean;
    setIsLoading: (val: boolean) => void;
  }
) => {

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

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
          </SheetHeader>
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
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

              <DialogTrigger asChild>
                <div
                  className={`w-[130px] cursor-pointer border ${buttonVariants({
                    variant: 'secondary',
                  })}`}
                >
                  <FileDown className="mr-2 w-5 h-5" />
                  Export Tasks
                </div>
              </DialogTrigger>
              <div
                onClick={() => deleteAllTasks(props)}
                className={`w-[130px] border ${buttonVariants({
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Export Format</DialogTitle>
                <DialogDescription>
                  Would you like to download your tasks as a JSON file or a TXT file?
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
                <Button onClick={handleExportJSON} className="w-full sm:w-auto hover:bg-white bg-[#3B82F6]">
                  <FileJson className="mr-2 h-4 w-4" />
                  Download .json
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </SheetContent>
      </Sheet>
    </span>
  );
};
