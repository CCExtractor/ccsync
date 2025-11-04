import React from 'react';
import { NavigationMenu } from '@/components/ui/navigation-menu';
import { buttonVariants, Button } from '@/components/ui/button';
import { BottomBarProps } from './bottom-bar-utils';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';

const BottomBar: React.FC<BottomBarProps> = ({
  onOpenFilterSheet,
  activeFilterCount,
}) => {
  return (
    <header className="sm:hidden fixed bottom-0 w-full bg-white border-t-[1px] dark:border-b-slate-700 dark:bg-background shadow-lg flex justify-between items-center p-4 z-40">
      <NavigationMenu className="mx-auto w-full justify-between items-center">
        {/* Navigation Icons */}
        <div className="flex space-x-2">
          <nav className="md:flex gap-2 justify-center flex-2">
            <a
              href={'#'}
              aria-label="Home"
              className={`text-[17px] ${buttonVariants({ variant: 'ghost' })}`}
            >
              <Icons.Home className="h-6 w-6" />
            </a>
            <a
              href={'#tasks'}
              aria-label="Tasks"
              className={`text-[17px] ${buttonVariants({ variant: 'ghost' })}`}
            >
              <Icons.Tasks className="h-6 w-6" />
            </a>
          </nav>
        </div>

        {/* Filter Button */}
        <Button
          variant="outline"
          onClick={onOpenFilterSheet}
          className="relative"
        >
          <Icons.Filter className="h-4 w-4 mr-2" />
          Filter
          {activeFilterCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </NavigationMenu>
    </header>
  );
};

export default BottomBar;
