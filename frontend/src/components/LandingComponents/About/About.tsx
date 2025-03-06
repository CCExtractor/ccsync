import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

const animateUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const About = () => {
  const controls = useAnimation();
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    } else {
      controls.start('hidden');
    }
  }, [controls, inView]);

  return (
    <motion.section
      ref={ref}
      id="about"
      data-testid="about-section"
      className="container py-24 sm:py-32"
      initial="hidden"
      animate={controls}
      variants={animateUp}
    >
      <div className="bg-muted/50 border rounded-lg py-12">
        <div className="px-6 flex flex-col-reverse md:flex-row gap-8 md:gap-12">
          <div className="bg-green-0 flex flex-col justify-between">
            <div className="pb-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                <span className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
                  About{' '}
                </span>
                CCSync
              </h2>
              <p className="text-xl text-muted-foreground mt-10 mb-5">
                CCSync uses a hosted Taskchampion Sync Server instance that
                helps users to sync tasks across all your Taskwarrior 3.0
                clients and higher.
                <br />
                Users can sign in using Google and generate their secret keys to
                setup synchronisation on their Taskwarrior clients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
