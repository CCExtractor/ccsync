import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MedalIcon, MapIcon, PlaneIcon, GiftIcon } from "../utils/Icons";

interface FeatureProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

const features: FeatureProps[] = [
  {
    icon: <MedalIcon />,
    title: "Sign in",
    description:
      "Sign in with Google to generate secret UUIDs, or generate your own",
  },
  {
    icon: <MapIcon />,
    title: "Setup",
    description:
      "Setup the taskserver for your Taskwarrior clients by following the documentation",
  },
  {
    icon: <PlaneIcon />,
    title: "Share",
    description:
      "Sign in on multiple devices and use the same UUIDs to sync tasks across all the clients or your team",
  },
  {
    icon: <GiftIcon />,
    title: "Deploy your own",
    description:
      "You can also deploy your own server instance by following this documentation",
  },
  //TODO: add the tcsc link here
];

export const HowItWorks = () => {
  return (
    <section
      id="howItWorks"
      className="container text-center py-24 sm:py-32"
    >
      <h2 className="text-3xl md:text-4xl font-bold ">
        How It{" "}
        <span className="inline bg-gradient-to-r from-[#61DAFB]  to-[#1fc0f1] text-transparent bg-clip-text">
          Works{" "}
        </span>
      </h2>
      <br></br>
      <br></br>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map(({ icon, title, description }: FeatureProps) => (
          <Card
            key={title}
            className="bg-muted/50"
          >
            <CardHeader>
              <CardTitle className="grid gap-4 place-items-center">
                {icon}
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>{description}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
