import { useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

interface MagneticProps {
  distance?: number;
}

export const useMagnetic = ({ distance = 40 }: MagneticProps = {}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 500, damping: 25 });
  const springY = useSpring(y, { stiffness: 500, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) / distance;
    const distanceY = (e.clientY - centerY) / distance;
    x.set(distanceX * distance);
    y.set(distanceY * distance);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return {
    ref,
    x: springX,
    y: springY,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  };
};
