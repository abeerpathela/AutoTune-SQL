import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="relative flex h-9 w-[4.25rem] items-center rounded-full border border-theme bg-[var(--bg-glass)] p-1 backdrop-blur-xl transition-colors hover:border-[var(--border-strong)]"
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="absolute h-7 w-7 rounded-full bg-[var(--text-primary)] shadow-sm"
        style={{ left: isDark ? 'calc(100% - 1.875rem)' : '0.25rem' }}
      />
      <Sun
        className={`relative z-10 ml-1.5 h-3.5 w-3.5 transition-colors ${
          !isDark ? 'text-[var(--bg-base)]' : 'text-[var(--text-subtle)]'
        }`}
      />
      <Moon
        className={`relative z-10 ml-auto mr-1.5 h-3.5 w-3.5 transition-colors ${
          isDark ? 'text-[var(--bg-base)]' : 'text-[var(--text-subtle)]'
        }`}
      />
      <span className="sr-only">{theme} mode active</span>
    </button>
  );
}
