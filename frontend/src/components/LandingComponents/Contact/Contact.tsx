import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AiOutlineDiscord } from 'react-icons/ai';
import { GithubIcon, MailIcon } from 'lucide-react';
import { TbBrandZulip } from "react-icons/tb";

export interface ContactProps {
  icon: JSX.Element;
  name: string;
  position: string;
  url: string;
}

const contactList: ContactProps[] = [
  {
    icon: <TbBrandZulip size={45} />,
    name: 'Zulip',
    position: 'Join our Zulip channel',
    url: 'https://ccextractor.org/public/general/support/',
  },
  {
    icon: <GithubIcon size={45} />,
    name: 'Github',
    position: 'Check out our Github repository',
    url: 'https://github.com/its-me-abhishek/ccsync',
  },
  {
    icon: <AiOutlineDiscord size={45} />,
    name: 'Discord',
    position: 'Join us at Discord for discussions',
    url: '',
  },
  {
    icon: <MailIcon size={45} />,
    name: 'Email',
    position: 'Email us for any queries',
    url: '',
  },
];

const cardVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
  hover: { scale: 1.05, transition: { duration: 0.3 } },
};

export const Contact = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section
      id="contact"
      data-testid="#contact"
      className="container py-24 sm:py-32 mt-0"
    >
      <h2 className="text-3xl md:text-4xl font-bold text-center">
        <span className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
          Contact{' '}
        </span>
        Us
      </h2>

      <br />
      <div
        data-testid="contact"
        ref={ref}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 gap-y-10"
      >
        {contactList.map(({ icon, name, position, url }: ContactProps) => (
          <motion.div
            key={name}
            data-testid="contact"
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={cardVariants}
            whileHover={'hover'}
          >
            <Card className="bg-muted/50 relative mt-8 flex flex-col justify-center items-center">
              <CardHeader className="mt-8 flex justify-center items-center pb-2">
                <a href={url}>{icon}</a>
                <CardTitle className="text-center">
                  <a href={url}>{name}</a>
                </CardTitle>
                <CardDescription className="inline bg-gradient-to-r from-[#61DAFB] to-[#1fc0f1] text-transparent bg-clip-text">
                  <a href={url}>{position}</a>
                </CardDescription>
              </CardHeader>
              <CardFooter></CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
