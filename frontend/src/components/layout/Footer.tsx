import { motion } from 'framer-motion';
import { Github, Heart } from 'lucide-react';
import { BRAND } from '../../lib/brand';
import { Logo } from '../brand/Logo';

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-theme bg-[var(--bg-glass)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-10 sm:flex-row">
        <Logo size="sm" showText showTagline to="/" />

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
          <span className="font-medium text-primary">{BRAND.name}</span>
          <span className="hidden text-subtle sm:inline">·</span>
          <span className="text-subtle">{BRAND.tagline}</span>
        </div>

        <motion.a
          href={BRAND.github}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="interactive-target group flex items-center gap-2 rounded-full border border-theme bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-cyan-500/40 hover:text-primary"
        >
          <Heart className="h-3.5 w-3.5 text-cyan-400 transition-transform group-hover:scale-110" />
          Made by{' '}
          <span className="font-semibold accent-shimmer">{BRAND.author}</span>
          <Github className="h-3.5 w-3.5 opacity-60" />
        </motion.a>
      </div>
    </footer>
  );
}
