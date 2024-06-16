import { buttonVariants } from "../../ui/button";
import { ModeToggle } from "../../theme-mode-toggle";
import { routeList } from "./navbar-utils";

export const NavbarDesktop = () => {
  return (
    <>
      <nav className="hidden md:flex gap-2 justify-center flex-1">
        {routeList.map(({ href, label }, i) => (
          <a
            rel="noreferrer noopener"
            href={href}
            key={i}
            className={`text-[17px] ${buttonVariants({ variant: "ghost" })}`}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="hidden md:flex gap-2">
        <ModeToggle />
      </div>
    </>
  );
};
