import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const cursorMedia = '(pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)';
export const CustomCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(() => window.matchMedia(cursorMedia).matches);
  useEffect(() => {
    const media = window.matchMedia(cursorMedia); const change = () => setEnabled(media.matches);
    media.addEventListener('change', change); return () => media.removeEventListener('change', change);
  }, []);
  return enabled ? <AnimatedCursor /> : null;
};
const AnimatedCursor: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 40, stiffness: 400, mass: 0.4 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') || 
        target.closest('button') ||
        target.classList.contains('interactive');
      
      setIsHovered(!!isInteractive);
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);


  return (
    <>
      <motion.div aria-hidden="true" data-custom-cursor
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-accent pointer-events-none z-50 hidden md:block"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        animate={{
          scale: isHovered ? 1.5 : 1,
          backgroundColor: isHovered ? 'rgba(15, 98, 254, 0.1)' : 'rgba(15, 98, 254, 0)',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      />
    </>
  );
};
