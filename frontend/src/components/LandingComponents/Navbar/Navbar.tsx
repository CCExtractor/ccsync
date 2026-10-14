import { useState, useEffect } from 'react';
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
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 w-full bg-white border-b-[1px] dark:border-b-slate-700 dark:bg-background transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
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
