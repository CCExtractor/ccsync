import React from 'react';
import { NavigationMenu } from '@/components/ui/navigation-menu';
import { buttonVariants } from '@/components/ui/button';
import { BottomBarProps } from './bottom-bar-utils';
import { Icons } from '@/components/ui/icons';
import { MultiSelectFilter } from '@/components/ui/multi-select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';

const BottomBar: React.FC<BottomBarProps> = ({
  projects,
  selectedProjects,
  setSelectedProject,
  status,
  selectedStatuses,
  setSelectedStatus,
  tags,
  selectedTags,
  setSelectedTag,
}) => {
  return (
    <header className="lg:hidden fixed bottom-0 w-full bg-white border-t-[1px] dark:border-b-slate-700 dark:bg-background shadow-lg flex justify-between items-center p-4 z-40">
      {/* Nav Links */}
      <NavigationMenu className="mx-auto">
        <div className="flex space-x-4 mr-2">
          <nav className="md:flex gap-2 justify-center flex-2">
            <a
              rel="noreferrer noopener"
              href={'#'}
              aria-label="Home"
              className={`text-[17px] ${buttonVariants({
                variant: 'ghost',
              })}`}
            >
              <Icons.Home className="h-6 w-6" />
            </a>
            <a
              rel="noreferrer noopener"
              href={'#tasks'}
              aria-label="Tasks"
              className={`text-[17px] ${buttonVariants({
                variant: 'ghost',
              })}`}
            >
              <Icons.Tasks className="h-6 w-6" />
            </a>
          </nav>
        </div>

        {/* Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-auto px-3" aria-label="Filter">
              <Icons.Filter className="h-4 w-4 mr-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4 flex flex-col gap-4 bg-background border shadow-lg rounded-lg">
            <MultiSelectFilter
              title="Projects"
              options={projects}
              selectedValues={selectedProjects}
              onSelectionChange={setSelectedProject}
              className="min-w-[200px]"
            />
            <MultiSelectFilter
              title="Status"
              options={status}
              selectedValues={selectedStatuses}
              onSelectionChange={setSelectedStatus}
              className="min-w-[200px]"
            />
            <MultiSelectFilter
              title="Tags"
              options={tags}
              selectedValues={selectedTags}
              onSelectionChange={setSelectedTag}
              className="min-w-[200px]"
            />
          </PopoverContent>
        </Popover>
      </NavigationMenu>
    </header>
  );
};

export default BottomBar;
