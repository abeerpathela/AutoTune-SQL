import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Logo } from './Logo';
import { BRAND } from '../../lib/brand';

type BrandStripProps = {
  title?: string;
  subtitle?: string;
};

/** Subtle page header that reinforces AutoTune-SQL branding. */
export function BrandStrip({ title, subtitle }: BrandStripProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 overflow-hidden rounded-2xl border border-theme bg-[var(--bg-glass)] backdrop-blur-xl"
    >
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'linear-gradient(135deg, var(--accent-glow) 0%, transparent 50%, var(--mesh-b) 100%)',
          }}
        />
        <div className="relative flex items-center gap-4">
          <Logo size="md" showText showTagline />
          <div className="hidden h-10 w-px bg-[var(--border)] sm:block" />
          <div className="relative hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              {BRAND.tagline}
            </p>
            {title && <p className="mt-0.5 text-sm font-medium text-primary">{title}</p>}
          </div>
        </div>
        {(title || subtitle) && (
          <div className="relative sm:text-right">
            {title && (
              <h2 className="flex items-center gap-2 text-lg font-semibold text-primary sm:justify-end">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
