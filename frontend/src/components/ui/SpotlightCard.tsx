import { useRef, type MouseEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section';
};

export function SpotlightCard({ children, className = '', as = 'div' }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const Component = motion[as] as typeof motion.div;

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty('--mouse-x', `${x}px`);
    ref.current.style.setProperty('--mouse-y', `${y}px`);
    ref.current.style.setProperty('--spotlight-opacity', '1');
  };

  const handleMouseLeave = () => {
    ref.current?.style.setProperty('--spotlight-opacity', '0');
  };

  return (
    <Component
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-2xl border border-theme bg-[var(--bg-glass)] backdrop-blur-xl ${className}`}
      style={{ '--spotlight-opacity': '0' } as React.CSSProperties}
    >
      {/* Gradient border glow near cursor */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[var(--spotlight-opacity,0)] transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--spotlight), transparent 40%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-px rounded-[calc(1rem-1px)] opacity-[var(--spotlight-opacity,0)] transition-opacity duration-300"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--spotlight), transparent 50%)`,
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </Component>
  );
}
