import { motion } from 'framer-motion';

export const AnimatedHeroGlow = () => {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute rounded-[24px] rotate-[35deg]"
      style={{
        top: 200,
        right: 460,
        width: 260,
        height: 400,
        filter: 'blur(150px)',
      }}
      animate={{
        right: [460, 160],
        backgroundColor: [
          'hsla(330, 100%, 50%, 0.2)',
          'hsla(240, 100%, 50%, 0.8)',
        ],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'linear',
      }}
    />
  );
};
