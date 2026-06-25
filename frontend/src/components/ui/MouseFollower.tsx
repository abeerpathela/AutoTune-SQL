import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const INTERACTIVE_SELECTOR =
  'button, a, [role="button"], input, select, textarea, .interactive-target';

export function MouseFollower() {
  const { isDark } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const mouseX = useMotionValue(-400);
  const mouseY = useMotionValue(-400);
  const size = useMotionValue(280);
  const opacity = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 120, damping: 22, mass: 0.4 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 22, mass: 0.4 });
  const sizeSpring = useSpring(size, { stiffness: 200, damping: 28 });
  const opacitySpring = useSpring(opacity, { stiffness: 300, damping: 30 });

  const [hoveringInteractive, setHoveringInteractive] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine)');
    const updateEnabled = () => setEnabled(mediaQuery.matches);
    updateEnabled();
    mediaQuery.addEventListener('change', updateEnabled);
    return () => mediaQuery.removeEventListener('change', updateEnabled);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      opacity.set(isDark ? 0.35 : 0.22);

      const target = e.target as HTMLElement | null;
      const interactive = !!target?.closest(INTERACTIVE_SELECTOR);
      setHoveringInteractive(interactive);
      size.set(interactive ? 420 : 280);
      opacity.set(interactive ? (isDark ? 0.55 : 0.4) : isDark ? 0.35 : 0.22);
    };

    const handleLeave = () => opacity.set(0);

    window.addEventListener('mousemove', handleMove);
    document.documentElement.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.documentElement.removeEventListener('mouseleave', handleLeave);
    };
  }, [mouseX, mouseY, size, opacity, isDark, enabled]);

  if (!enabled) return null;

  const gradient = isDark
    ? hoveringInteractive
      ? 'radial-gradient(circle, rgba(34,211,238,0.14) 0%, rgba(255,255,255,0.06) 35%, transparent 70%)'
      : 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)'
    : hoveringInteractive
      ? 'radial-gradient(circle, rgba(161,161,170,0.14) 0%, rgba(0,0,0,0.03) 40%, transparent 70%)'
      : 'radial-gradient(circle, rgba(161,161,170,0.1) 0%, transparent 65%)';

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-[5] hidden rounded-full mix-blend-screen md:block"
      style={{
        left: springX,
        top: springY,
        x: '-50%',
        y: '-50%',
        width: sizeSpring,
        height: sizeSpring,
        background: gradient,
        opacity: opacitySpring,
      }}
    />
  );
}
