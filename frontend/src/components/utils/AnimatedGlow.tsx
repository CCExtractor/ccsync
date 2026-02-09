import { motion } from 'framer-motion';

interface AnimatedGlowProps {
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedGlow = ({ className, style }: AnimatedGlowProps) => {
  return (
    <motion.div
      className={className}
      style={{
        filter: 'blur(150px)',
        ...style,
      }}
      animate={{
        background: [
          'hsla(330, 100%, 50%, 20%)',
          'hsla(240, 100%, 50%, 80%)',
          'hsla(330, 100%, 50%, 20%)',
        ],
        right: ['460px', '160px', '460px'],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
};
