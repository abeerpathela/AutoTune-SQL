import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useMagnetic } from '../../hooks/useMagnetic';

export const InteractionLayer = () => {
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);
  const springX = useSpring(mouseX, { stiffness: 500, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 500, damping: 30 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="fixed pointer-events-none z-50 rounded-full mix-blend-screen"
      style={{
        left: springX,
        top: springY,
        x: '-50%',
        y: '-50%',
        width: 300,
        height: 300,
        background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    />
  );
};

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const MagneticButton = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  type = 'button',
  disabled = false,
}: MagneticButtonProps) => {
  const { ref, x, y, handlers } = useMagnetic({ distance: 30 });

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ x, y, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden rounded-full transition-all duration-200 font-semibold text-sm px-7 py-3 ${
        variant === 'primary'
          ? 'bg-zinc-100 text-zinc-900 hover:bg-white shadow-lg hover:shadow-xl'
          : 'bg-zinc-900/60 text-zinc-100 border border-zinc-700/60 hover:bg-zinc-800/70'
      } ${className}`}
      {...handlers}
    >
      {children}
    </motion.button>
  );
};
