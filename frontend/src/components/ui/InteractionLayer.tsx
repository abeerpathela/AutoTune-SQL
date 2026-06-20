import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

export const InteractionLayer = () => {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
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
        width: 200,
        height: 200,
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, transparent 70%)',
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
}

export const MagneticButton = ({ children, onClick, className = '', variant = 'primary' }: MagneticButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 500, damping: 25 });
  const springY = useSpring(y, { stiffness: 500, damping: 25 });
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) / 20;
    const distanceY = (e.clientY - centerY) / 20;
    x.set(distanceX);
    y.set(distanceY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsPressed(false);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={onClick}
      style={{ x: springX, y: springY, scale: isPressed ? 0.95 : 1 }}
      className={`relative overflow-hidden rounded-full transition-all duration-200 font-semibold text-sm ${
        variant === 'primary'
          ? 'bg-zinc-50 text-zinc-900 hover:bg-white shadow-lg hover:shadow-xl'
          : 'bg-zinc-900/60 text-zinc-100 border border-zinc-700/60 hover:bg-zinc-800/70'
      } px-7 py-3 ${className}`}
    >
      {children}
    </motion.button>
  );
};
