import { url } from "@/components/utils/URLs";
import { Button } from "../../ui/button";
import { buttonVariants } from "../../ui/button";
import { HeroCards } from "./HeroCards";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

export const Hero = () => {
  return (
    <section className="container grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10">
      <div className="text-center lg:text-start space-y-6">
        <main className="text-5xl md:text-6xl font-bold">
          <h1 className="inline">
            <span className="inline bg-gradient-to-r from-[#61DAFB]  to-[#1fc0f1] text-transparent bg-clip-text">
              CCSync
            </span>{" "}
            - the hosted solution
          </h1>{" "}
          for syncing with all your{" "}
          <h2 className="inline">
            <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
              Taskwarrior
            </span>{" "}
            clients
          </h2>
        </main>

        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
          Effortlessly sync your tasks across all your TaskWarrior clients
        </p>

        <div className="space-y-4 md:space-y-0 md:space-x-4">
          <a href={url.backendURL + "auth/oauth"}>
            <Button className="w-full md:w-1/3 bg-blue-400 hover:bg-blue-500">Sign in to get started</Button>
          </a>
          <a
            href="https://github.com/its-me-abhishek/ccsync"
            target="_blank"
            className={`w-full md:w-1/3 ${buttonVariants({
              variant: "outline",
            })}`}
          >
            Github Repository
            <GitHubLogoIcon className="ml-2 w-5 h-5" />
          </a>
        </div>
      </div>

      <div className="z-10">
        <HeroCards />
      </div>

      <div className="shadow"></div>
    </section >
  );
};
