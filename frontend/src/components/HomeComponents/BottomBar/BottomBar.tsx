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
import { FaHome as HomeIcon, FaTasks as TasksIcon} from "react-icons/fa";

const BottomBar: React.FC<BottomBarProps> = ({
  projects,
  selectedProject,
  setSelectedProject,
  status,
  selectedStatus,
  setSelectedStatus,
}) => {
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
              <HomeIcon className='w-6 h-6' />
            </a>
            <a
              rel="noreferrer noopener"
              href={'#tasks'}
              className={`text-[17px] ${buttonVariants({
                variant: 'ghost',
              })}`}
            >
              <TasksIcon className='w-6 h-6' />
            </a>
          </nav>
        </div>
        <Select
          value={
            selectedProject !== 'all' ? `project-${selectedProject}` :
            selectedStatus !== 'all' ? `status-${selectedStatus}` :
            'all'
          }
          onValueChange={(value) => {
            if (value.startsWith('project-')) {
              const project = value.replace('project-', '');
              setSelectedProject(project);
              setSelectedStatus('all');
            } else if (value.startsWith('status-')) {
              const status = value.replace('status-', '');
              setSelectedStatus(status);
              setSelectedProject('all');
            } else if (value === 'all') {
              setSelectedProject('all');
              setSelectedStatus('all');
            }
          }}
          >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter tasks" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="text-base font-semibold">Projects</SelectLabel>
              <SelectItem value="all">All</SelectItem>
              {projects.map((project) => (
                <SelectItem key={`project-${project}`} value={`project-${project}`}>
                  {project}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel className="text-base font-semibold">Status</SelectLabel>
              {status.map((statusItem) => (
                <SelectItem key={`status-${statusItem}`} value={`status-${statusItem}`}>
                  {statusItem}
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
