import { motion } from 'framer-motion';
import { useMagnetic } from '../../hooks/useMagnetic';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'gradient';
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
  const { ref, x, y, handlers } = useMagnetic({ distance: 24 });

  const variantClass =
    variant === 'gradient'
      ? 'btn-gradient'
      : variant === 'secondary'
        ? 'btn-secondary backdrop-blur-xl hover:bg-[var(--accent-glow)]'
        : 'btn-primary';

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ x, y }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      className={`interactive-target relative overflow-hidden rounded-full px-7 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${variantClass} ${className}`}
      {...handlers}
    >
      {children}
    </motion.button>
  );
};

/** @deprecated Use MouseFollower instead */
export const InteractionLayer = () => null;
