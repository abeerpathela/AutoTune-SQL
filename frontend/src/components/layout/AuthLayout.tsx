import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, GraduationCap, Brain, Shield } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { BRAND } from '../../lib/brand';

const perks = [
  { icon: Zap, text: 'AI-powered SQL rewriting in milliseconds' },
  { icon: Brain, text: 'ML models predict slow queries before production' },
  { icon: GraduationCap, text: '36-chapter academy with official certification' },
  { icon: Shield, text: 'Enterprise-grade explain plans & guardrails' },
];

type AuthLayoutProps = {
  children: React.ReactNode;
  heading: string;
  subheading: string;
};

export function AuthLayout({ children, heading, subheading }: AuthLayoutProps) {
  return (
    <div className="relative mx-auto grid min-h-[calc(100vh-10rem)] max-w-6xl gap-6 sm:gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
      {/* Brand panel */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative order-2 lg:order-1"
      >
        <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

        <Link to="/" className="interactive-target mb-8 inline-block">
          <Logo size="xl" showText showTagline />
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-2xl font-bold leading-tight tracking-tight text-primary sm:text-3xl md:text-4xl lg:text-5xl"
        >
          Welcome to{' '}
          <span className="accent-shimmer">{BRAND.name}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-4 max-w-md text-lg leading-relaxed text-muted"
        >
          The ML-driven platform that tunes your PostgreSQL queries, teaches you optimization,
          and certifies your skills — all in one place.
        </motion.p>

        <ul className="mt-6 hidden space-y-4 sm:block sm:mt-10">
          {perks.map(({ icon: Icon, text }, i) => (
            <motion.li
              key={text}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              className="flex items-start gap-3 text-sm text-muted"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-theme bg-[var(--bg-elevated)]">
                <Icon className="h-4 w-4 text-cyan-400" />
              </span>
              {text}
            </motion.li>
          ))}
        </ul>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 hidden flex-wrap gap-3 sm:flex sm:mt-10"
        >
          {['500+ engineers', '36 chapters', 'Llama-3.3 AI'].map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-theme bg-[var(--accent-glow)] px-3 py-1 text-xs font-medium text-primary"
            >
              {badge}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Form panel */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="order-1 lg:order-2"
      >
        <div className="glass-strong overflow-hidden rounded-2xl p-6 shadow-glow-cyan sm:rounded-3xl sm:p-8 md:p-10">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-primary md:text-3xl">{heading}</h2>
            <p className="mt-2 text-muted">{subheading}</p>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
