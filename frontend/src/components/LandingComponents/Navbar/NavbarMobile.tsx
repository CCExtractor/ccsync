import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button, buttonVariants } from '../../ui/button';
import { Menu } from 'lucide-react';
import { ModeToggle } from '../../utils/ThemeModeToggle';
import { routeList } from './navbar-utils';
import { url } from '@/components/utils/URLs';

export const NavbarMobile = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <span className="flex md:hidden">
      <ModeToggle />

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger className="px-2">
          <Menu
            className="flex md:hidden h-5 w-5"
            onClick={() => setIsOpen(true)}
          >
            <span className="sr-only">Menu Icon</span>
          </Menu>
        </SheetTrigger>

        <SheetContent side={'left'}>
          <SheetHeader>
            <SheetTitle className="font-bold text-xl">CCSync</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col justify-center items-center gap-2 mt-4">
            {routeList.map(({ href, label }) => (
              <a
                rel="noreferrer noopener"
                key={label}
                href={href}
                onClick={() => setIsOpen(false)}
                className={buttonVariants({ variant: 'ghost' })}
              >
                {label}
              </a>
            ))}
            <a target="_blank" href={url.githubDocsURL}>
              <Button variant={'outline'}>Docs</Button>
            </a>
          </nav>
        </SheetContent>
      </Sheet>
    </span>
  );
};
