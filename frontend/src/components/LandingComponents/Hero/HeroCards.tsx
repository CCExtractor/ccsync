import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { motion } from 'framer-motion';

const popIn = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.5 } },
};

export const HeroCards = () => {
  return (
    <div className="hidden lg:flex flex-row flex-wrap gap-8 relative w-[700px] h-[500px]">
      <motion.div initial="hidden" animate="visible" variants={popIn} className="mt-4 absolute w-[340px] -top-[15px] drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <Card>
          <CardContent className="text-center pb-2 mt-5 mb-5">Keep your data safe with top-notch security features.</CardContent>
        </Card>
      </motion.div>
      <motion.div initial="hidden" animate="visible" variants={popIn} className="absolute right-[20px] mt-5 top-4 w-80 flex flex-col justify-center items-center drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <Card>
          <CardContent className="text-center pb-2 mt-5 mb-5">
            <p>Sign in to generate your keys in order to sync across all your Taskwarrior clients</p>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div initial="hidden" animate="visible" variants={popIn} className="absolute top-[150px] left-[50px] w-72 drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <Card>
          <CardContent className="text-center pb-2 mt-5 mb-5">
            <p>Hassle-free sync across all devices</p>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div initial="hidden" animate="visible" variants={popIn} className="absolute w-[350px] -right-[10px] bottom-[135px] drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <Card>
          <CardContent className="text-center pb-5 mt-5 mb-5">
            <p>Have any issues or queries?</p>
            <p>
              <a href="#contact" className="text-sky-400">Contact us</a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
