import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BRAND } from '../../lib/brand';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  to?: string;
  className?: string;
};

const heights = { sm: 'h-8', md: 'h-10', lg: 'h-14', xl: 'h-20' };

export function Logo({
  size = 'md',
  showText = true,
  showTagline = false,
  to,
  className = '',
}: LogoProps) {
  const content = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`flex items-center gap-3 ${className}`}
    >
      <img
        src={BRAND.logo}
        alt={BRAND.name}
        className={`${heights[size]} w-auto object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.25)]`}
      />
      {showText && (
        <div className="hidden min-w-0 flex-col sm:flex">
          <span className="truncate text-sm font-bold tracking-tight text-primary lg:text-base">
            {BRAND.name}
          </span>
          {showTagline && (
            <span className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-subtle">
              {BRAND.tagline}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );

  if (to) {
    return (
      <Link to={to} className="interactive-target shrink-0 rounded-lg outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
