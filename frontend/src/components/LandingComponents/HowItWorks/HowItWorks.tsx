import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { LiaMedalSolid } from 'react-icons/lia';
import { TbMapPin2 } from 'react-icons/tb';
import { GiAirplaneDeparture } from 'react-icons/gi';
import { GrServer } from 'react-icons/gr';

interface FeatureProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

const features: FeatureProps[] = [
  {
    icon: <LiaMedalSolid size={50} color="pink" className="m-0.5" />,
    title: 'Sign in',
    description:
      'Sign in with Google to generate secret UUIDs, or generate your own using a random key generator',
  },
  {
    icon: <TbMapPin2 size={50} color="pink" className="m-0.5" />,
    title: 'Setup',
    description:
      'Setup the taskserver for your Taskwarrior clients by following the documentation',
  },
  {
    icon: <GiAirplaneDeparture size={50} color="pink" className="m-0.5" />,
    title: 'Share',
    description:
      'Sign in on multiple devices and use the same UUIDs to sync tasks across all the clients or your team',
  },
  {
    icon: <GrServer size={50} color="pink" className="m-0.5" />,
    title: 'Deploy your own',
    description:
      'You can also deploy your own server instance by following this documentation',
  },
];

const cardVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
  hover: { scale: 1.05, transition: { duration: 0.3 } },
};

export const HowItWorks = () => {
  const controls = useAnimation();
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <section
      id="howItWorks"
      data-testid="#howItWorks"
      className="container text-center py-24 sm:py-32 scroll-mt-16"
    >
      <h2 className="text-3xl md:text-4xl font-bold ">
        How It{' '}
        <span className="inline bg-gradient-to-r from-[#61DAFB] to-[#1fc0f1] text-transparent bg-clip-text">
          Works{' '}
        </span>
      </h2>
      <br />
      <br />
      <div
        ref={ref}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 gap-y-10"
      >
        {features.map(({ icon, title, description }: FeatureProps) => (
          <motion.div
            key={title}
            initial="hidden"
            animate={controls}
            variants={cardVariants}
            whileHover="hover"
            className="bg-muted rounded-lg"
          >
            <Card className="bg-muted/50 relative flex flex-col justify-center items-center">
              <CardHeader>
                <CardTitle className="grid gap-4 place-items-center">
                  {icon}
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>{description}</CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
