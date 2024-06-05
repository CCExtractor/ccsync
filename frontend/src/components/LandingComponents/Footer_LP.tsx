import logo from "../../assets/logo.png";

export const Footer = () => {
  return (
    <footer id="footer">
      <hr className="w-11/12 mx-auto" />

      <section className="container py-20 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
        <div className="col-span-full xl:col-span-2">
          <a
            rel="noreferrer noopener"
            href="/"
            className="font-bold text-xl flex"
          >
            <img src={logo} alt="Logo" className="h-12 mr-0 mt-2 bg-blend-soft-light" />
          </a>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">Community</h3>
          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              Github
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              Slack
            </a>
          </div>
          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              Discord
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">About</h3>
          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              Features
            </a>
          </div>


          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              FAQ
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">Important Links</h3>
          <div>
            <a
              rel="noreferrer noopener"
              href="https://taskwarrior.org/docs/"
              className="opacity-60 hover:opacity-100"
              target="_blank"
            >
              Taskwarrior
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="https://github.com/GothenburgBitFactory/taskchampion-sync-server/tree/main"
              className="opacity-60 hover:opacity-100"
              target="_blank"
            >
              Taskchampion-sync-server
            </a>
          </div>
        </div>
      </section>

      <section className="container pb-14 text-center">
        <h3>
          &copy; 2024 {" "}
          <a
            rel="noreferrer noopener"
            target="_blank"
            className="text-red transition-all border-secondary hover:border-b-2"
          >
            CCSync
          </a>
        </h3>
      </section>
    </footer>
  );
};
