import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AiOutlineDiscord } from "react-icons/ai";
import { SlackIcon } from "lucide-react";
import { GithubIcon } from "lucide-react";
import { MailIcon } from "lucide-react";

interface ContactProps {
  icon: JSX.Element;
  name: string;
  position: string;
  url: string;
}

const contactList: ContactProps[] = [
  {
    icon: <SlackIcon size={45} />,
    name: "Slack",
    position: "Join our slack channel",
    url: "",
  },
  {
    icon: <GithubIcon size={45} />,
    name: "Github",
    position: "Check out our Github repository",
    url: "",
  },
  {
    icon: <AiOutlineDiscord size={45}/>,
    name: "Discord",
    position: "Join us at Discord for discussions",
    url: "",
  },
  {
    icon: <MailIcon size={45} />,
    name: "Email",
    position: "Email us for any queries",
    url: "",
  },
];

export const Contact = () => {
  return (
    <section
      id="contact"
      className="container py-24 sm:py-32 mt-0"
    >
      <h2 className="text-3xl md:text-4xl font-bold">
        <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
          Contact{" "}
        </span>
        Us
      </h2>
      <br></br>
      <br></br>
      <br></br>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 gap-y-10">
        {contactList.map(
          ({ icon, name, position }: ContactProps) => (
            <Card
              key={name}
              className="bg-muted/50 relative mt-8 flex flex-col justify-center items-center"
            >
              <CardHeader className="mt-8 flex justify-center items-center pb-2">
                {icon}
                <CardTitle className="text-center">{name}</CardTitle>
                <CardDescription className="inline bg-gradient-to-r from-[#61DAFB]  to-[#1fc0f1] text-transparent bg-clip-text">
                  {position}
                </CardDescription>
              </CardHeader>
              <CardFooter>
              </CardFooter>
            </Card>
          )
        )}
      </div>
    </section>
  );
};
