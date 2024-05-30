import {
  Card,
  CardContent,
} from "@/components/ui/card";

export const HeroCards = () => {
  return (
    <div className="hidden lg:flex flex-row flex-wrap gap-8 relative w-[700px] h-[500px]">

      <Card className="mt-4 absolute w-[340px] -top-[15px] drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <CardContent className="text-center pb-2 mt-5 mb-5">Keep your data safe with top-notch security features.
        </CardContent>
      </Card>
      <Card className="absolute right-[20px] mt-5 top-4 w-80 flex flex-col justify-center items-center drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <CardContent className="text-center pb-2 mt-5 mb-5">
          <p>
            Sign in to generate your keys in order to sync across all your Taskwarrior clients
          </p>
        </CardContent>
      </Card>
      <Card className="absolute top-[150px] left-[50px] w-72  drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <CardContent className="text-center pb-2 mt-5 mb-5">
          <p>
            Hassle-free sync across all devices
          </p>
        </CardContent>
      </Card>
      <Card className="absolute w-[350px] -right-[10px] bottom-[135px]  drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <CardContent className="text-center pb-2 mt-5 mb-5">
          <p>
            Have any issues or queries?
          </p>
          <p>
            Contact us {/*to do*/}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
