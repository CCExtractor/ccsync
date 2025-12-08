import { Card, CardContent } from '@/components/ui/card';

import { motion } from 'framer-motion';

const popIn = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.5 } },
  hover: { scale: 1.05, transition: { duration: 0.3 } },
};

export const HeroCards = () => {
  return (
    // Prevent overflow at lg breakpoint
    <div className="hidden lg:flex flex-row flex-wrap gap-8 relative lg:w-[560px] lg:h-[480px] xl:w-[700px] xl:h-[500px]">
      <motion.div
        whileHover={'hover'}
        initial="hidden"
        animate="visible"
        variants={popIn}
        className="mt-4 absolute lg:w-[300px] xl:w-[340px] -top-[30px] drop-shadow-xl shadow-black/10 dark:shadow-white/10"
      >
        <Card>
          <CardContent className="text-center pb-2 mt-5 mb-5">
            Keep your data safe with top-notch security features.
          </CardContent>
        </Card>
      </motion.div>
      <motion.div
        whileHover={'hover'}
        initial="hidden"
        animate="visible"
        variants={popIn}
        className="absolute lg:right-[30px] xl:right-[8px] mt-5 top-20 lg:w-[260px] xl:w-80 flex flex-col justify-center items-center drop-shadow-xl shadow-black/10 dark:shadow-white/10"
      >
        <Card>
          <CardContent className="text-center pb-2 mt-5 mb-5">
            <p>
              Sign in to generate your keys in order to sync across all your
              Taskwarrior clients
            </p>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div
        whileHover={'hover'}
        initial="hidden"
        animate="visible"
        variants={popIn}
        className="absolute lg:top-[240px] lg:left-[24px] xl:top-[170px] xl:left-[40px] w-72 drop-shadow-xl shadow-black/10 dark:shadow-white/10"
      >
        <Card>
          <CardContent className="text-center pb-2 mt-5 mb-5">
            <p>Hassle-free sync across all devices</p>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div
        whileHover={'hover'}
        initial="hidden"
        animate="visible"
        variants={popIn}
        className="absolute lg:w-[290px] xl:w-[350px] lg:right-[30px] xl:-right-[6px] lg:bottom-[20px] xl:bottom-[90px] drop-shadow-xl shadow-black/10 dark:shadow-white/10"
      >
        <Card>
          <CardContent className="text-center pb-5 mt-5 mb-5">
            <p>Have any issues or queries?</p>
            <p>
              <a href="#contact" className="text-sky-400">
                Contact us
              </a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
