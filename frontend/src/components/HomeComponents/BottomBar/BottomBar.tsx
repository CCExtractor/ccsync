import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NavigationMenu } from '@/components/ui/navigation-menu';
import { buttonVariants } from '@/components/ui/button';
import { BottomBarProps } from './bottom-bar-utils';
import { Icons } from '@/components/icons';

const BottomBar: React.FC<BottomBarProps> = ({
  projects,
  selectedProject,
  setSelectedProject,
  status,
  selectedStatus,
  setSelectedStatus,
}) => {

  const handleFilterChange = (value: string) => {
    if (!value) return;
    const [type, filterValue] = value.split(':');
    if (type === 'project') {
      setSelectedProject(filterValue);
    } else if (type === 'status') {
      setSelectedStatus(filterValue);
    }
  };
  return (
    <header className="sm:hidden fixed bottom-0 w-full bg-white border-t-[1px] dark:border-b-slate-700 dark:bg-background shadow-lg flex justify-between items-center p-4 z-40">
      <NavigationMenu className="mx-auto">
        <div className="flex space-x-4 mr-2">
          <nav className="md:flex gap-2 justify-center flex-2">
            <a
              rel="noreferrer noopener"
              href={'#'}
              className={`text-[17px] ${buttonVariants({
                variant: 'ghost',
              })}`}
            >
              <Icons.Home className="h-6 w-6" />
            </a>
            <a
              rel="noreferrer noopener"
              href={'#tasks'}
              className={`text-[17px] ${buttonVariants({
                variant: 'ghost',
              })}`}
            >
              <Icons.Tasks className="h-6 w-6" />
            </a>
          </nav>
        </div>
        <Select onValueChange={handleFilterChange}>
          <SelectTrigger className="w-auto">
            <div className="flex items-center gap-2">
              <Icons.Filter className="h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {/* Group for Projects */}
            <SelectGroup>
              <SelectLabel className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Projects</SelectLabel>
              <SelectItem value="project:all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project} value={`project:${project}`}>
                  {project}
                </SelectItem>
              ))}
            </SelectGroup>

            {/* Group for Statuses */}
            <SelectGroup>
              <SelectLabel className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Status</SelectLabel>
              <SelectItem value="status:all">All</SelectItem>
              {status.map((s) => (
                <SelectItem key={s} value={`status:${s}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </NavigationMenu>
    </header>
  );
};

export default BottomBar;
