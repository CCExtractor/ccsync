import React, { Dispatch, SetStateAction } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NavigationMenu } from '@/components/ui/navigation-menu';
import { buttonVariants } from '@/components/ui/button';

interface BottomBarProps {
  projects: string[];
  selectedProject: string | null;
  setSelectedProject: Dispatch<SetStateAction<string>>;
}

const BottomBar: React.FC<BottomBarProps> = ({ projects, selectedProject, setSelectedProject }) => {
  return (
    <header className="sm:hidden fixed bottom-0 w-full bg-white border-t-[1px] dark:border-b-slate-700 dark:bg-background shadow-lg flex justify-between items-center p-4 z-40">
      <NavigationMenu className="mx-auto">
        <div className="flex space-x-3 mr-2">
          <nav className="md:flex gap-2 justify-center flex-1">
            <a
              rel="noreferrer noopener"
              href={"#"}
              className={`text-[17px] ${buttonVariants({
                variant: "ghost",
              })}`}
            >Home
            </a>
            <a
              rel="noreferrer noopener"
              href={"#tasks"}
              className={`text-[17px] ${buttonVariants({
                variant: "ghost",
              })}`}
            >Tasks
            </a>
          </nav>
        </div>
        <Select value={selectedProject || ""} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Projects</SelectLabel>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project} value={project}>
                  {project}
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
