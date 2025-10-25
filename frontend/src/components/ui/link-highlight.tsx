import { motion } from 'framer-motion';
import { useState } from 'react';

export function HighlightLink({
  href,
  children,
  rel,
  target,
}: {
  href: string;
  children: React.ReactNode;
  rel: string;
  target?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.a
      target={target}
      rel={rel}
      href={href}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="opacity-60 hover:opacity-100 relative inline-block"
    >
      {children}
      <motion.span
        initial={{ width: 0 }}
        animate={{ width: isHovered ? '100%' : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#E776CB] via-[#FFFFFF] to-[#5FD9FA] rounded"
      />
    </motion.a>
  );
}
