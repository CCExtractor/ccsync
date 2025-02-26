import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import logo from '../../../assets/logo.png';
import logoLight from '../../../assets/logo_light.png';
import { NavbarMobile } from './NavbarMobile';
import { NavbarDesktop } from './NavbarDesktop';

export const Navbar = () => {
  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-slate-700 dark:bg-background">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="container h-14 px-4 w-screen flex justify-between items-center">
          <NavigationMenuItem className="font-bold flex">
            <a
              rel="noreferrer noopener"
              href="/"
              className="ml-2 font-bold text-xl flex items-center dark:hidden"
            >
              <img
                src={logoLight}
                alt="Logo-Light"
                className="h-12 min-h-12 min-w-48 mr-0 mt-2 bg-blend-soft-light"
              />
            </a>
            <a
              rel="noreferrer noopener"
              href="/"
              className="ml-2 font-bold text-xl hidden dark:flex items-center"
            >
              <img
                src={logo}
                alt="Logo"
                className="h-12 min-h-12 min-w-48 mr-0 mt-2 bg-blend-soft-light"
              />
            </a>
          </NavigationMenuItem>
          <NavbarDesktop />
          <NavbarMobile />
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};
