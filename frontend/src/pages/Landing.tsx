import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { Database, Zap, Code, BarChart2, ArrowRight } from 'lucide-react';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { Logo } from '../components/brand/Logo';
import { BRAND } from '../lib/brand';
import { useAuth } from '../contexts/AuthContext';
import { buildLoginPath } from '../lib/redirect';

function WordReveal({ text, className = '' }: { text: string; className?: string }) {
  const words = text.split(' ');

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.55,
            delay: 0.08 + i * 0.07,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block mr-[0.28em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Database;
  title: string;
  description: string;
}) {
  return (
    <SpotlightCard className="p-5 sm:p-6">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-theme bg-[var(--bg-elevated)] sm:mb-5 sm:h-12 sm:w-12">
        <Icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
      </div>
      <h3 className="mb-1.5 text-base font-semibold text-primary sm:mb-2 sm:text-xl">{title}</h3>
      <p className="text-sm leading-relaxed text-muted sm:text-base">{description}</p>
    </SpotlightCard>
  );
}

function HeroSqlGraphic({ interactive = true }: { interactive?: boolean }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [8, -8]), {
    stiffness: 120,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-10, 10]), {
    stiffness: 120,
    damping: 22,
  });
  const floatY = useSpring(0, { stiffness: 40, damping: 12 });

  useEffect(() => {
    let frame: number;
    const animate = () => {
      floatY.set(Math.sin(Date.now() / 1200) * 6);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [floatY]);

  useEffect(() => {
    if (!interactive) return;
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseX.set(e.clientX - cx);
      mouseY.set(e.clientY - cy);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mouseX, mouseY, interactive]);

  return (
    <motion.div
      style={
        interactive
          ? { rotateX, rotateY, y: floatY, transformPerspective: 900 }
          : { y: floatY, transformPerspective: 900 }
      }
      className="relative w-full"
    >
      <div className="glass-strong rounded-2xl border border-theme p-4 shadow-glow-cyan sm:p-6">
        <div className="mb-3 flex items-center gap-2 border-b border-theme pb-2.5 sm:mb-4 sm:pb-3">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/80 sm:h-3 sm:w-3" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80 sm:h-3 sm:w-3" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 sm:h-3 sm:w-3" />
          <span className="ml-2 font-mono text-[11px] text-subtle sm:ml-3 sm:text-sm">optimizer.sql</span>
        </div>
        <div className="space-y-1 font-mono text-[13px] leading-relaxed sm:space-y-1.5 sm:text-base">
          <div>
            <span className="text-subtle">1</span>{' '}
            <span className="text-cyan-400/90">EXPLAIN ANALYZE</span>{' '}
            <span className="text-primary">SELECT</span>{' '}
            <span className="text-muted">u.email, COUNT(o.id)</span>
          </div>
          <div>
            <span className="text-subtle">2</span>{' '}
            <span className="text-cyan-400/90">FROM</span>{' '}
            <span className="text-muted">users u</span>
          </div>
          <div>
            <span className="text-subtle">3</span>{' '}
            <span className="text-cyan-400/90">JOIN</span>{' '}
            <span className="text-muted">orders o ON u.id = o.user_id</span>
          </div>
          <div>
            <span className="text-subtle">4</span>{' '}
            <span className="text-cyan-400/90">GROUP BY</span>{' '}
            <span className="text-muted">u.email</span>
          </div>
          <div>
            <span className="text-subtle">5</span>{' '}
            <span className="text-cyan-400/90">HAVING</span>{' '}
            <span className="text-muted">COUNT(o.id) &gt; 10;</span>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-3 rounded-lg border border-[var(--success-border)] bg-success-subtle px-3 py-1.5 text-xs font-medium text-success sm:mt-4 sm:py-2 sm:text-sm"
        >
          ✓ Index scan · 12ms · 94% faster
        </motion.div>
      </div>
    </motion.div>
  );
}

export const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goToProtectedRoute = (path: string) => {
    if (user) {
      navigate(path);
      return;
    }
    navigate(buildLoginPath(path));
  };

  return (
    <div className="relative z-10 -mx-4 flex flex-col sm:mx-0">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-80" />

      {/* ─── Hero Section ─── */}
      <section className="relative flex flex-col pb-6 sm:pb-24">
        <div className="flex w-full flex-col gap-4 px-4 sm:gap-8 lg:gap-16">
          {/* Brand chip — compact on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Logo
              size="lg"
              showText
              showTagline
              to="/"
              className="mb-3 hidden sm:flex sm:mb-5 [&_img]:h-14"
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-theme bg-[var(--bg-glass)] px-2.5 py-1 text-xs font-medium text-muted backdrop-blur-xl sm:px-3 sm:py-1.5 sm:text-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 sm:h-2 sm:w-2" />
              {BRAND.tagline} · Powered by Llama-3.3
            </span>
          </motion.div>

          {/* Hero Heading — large, tight, balanced */}
          <h1 className="text-[2rem] font-bold leading-[1.1] tracking-tighter text-primary sm:text-5xl sm:font-semibold sm:tracking-tight lg:text-7xl" style={{ textWrap: 'balance' }}>
            <WordReveal text="Engineering-grade" />
            <br />
            <span className="accent-shimmer inline">
              <WordReveal text="SQL Optimization." />
            </span>
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="max-w-xl text-[15px] leading-relaxed text-muted sm:text-lg"
          >
            Stop guessing about query performance. AutoTune-SQL uses AI and machine learning
            to analyze, optimize, and predict slow queries before they hit production.
          </motion.p>

          {/* CTA Buttons — TRUE full-width stacked on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex w-full flex-col gap-3 sm:max-w-md sm:flex-row sm:gap-4 lg:max-w-none"
          >
            <motion.button
              onClick={() => goToProtectedRoute('/optimizer')}
              whileTap={{ scale: 0.96 }}
              className="btn-primary interactive-target flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold shadow-lg sm:w-auto"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </motion.button>
            <motion.button
              onClick={() => goToProtectedRoute('/learn')}
              whileTap={{ scale: 0.96 }}
              className="btn-secondary interactive-target flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold backdrop-blur-xl sm:w-auto"
            >
              Open Academy
            </motion.button>
          </motion.div>

          {/* Hero SQL Graphic — below CTAs on mobile with mask-image fade */}
          <div className="hero-graphic-mask -mx-4 mt-1 w-[calc(100%+2rem)] sm:mt-0 lg:hidden">
            <HeroSqlGraphic interactive={false} />
          </div>

          {/* Social proof — tight spacing */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            className="-mt-2 flex items-center gap-3 sm:mt-0 sm:gap-8 sm:pt-4"
          >
            <div className="flex -space-x-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--bg-base)] bg-[var(--bg-elevated)] text-xs font-medium text-primary sm:h-10 sm:w-10 sm:text-sm"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted sm:text-base">
              <span className="font-semibold text-primary">500+</span> engineers optimizing daily
            </p>
          </motion.div>

          {/* Desktop-only interactive graphic */}
          <div className="hidden lg:block">
            <HeroSqlGraphic />
          </div>
        </div>
      </section>

      {/* ─── Feature Cards ─── */}
      <section className="relative pb-12 sm:pb-32">
        <div className="grid grid-cols-1 gap-2.5 px-4 min-[420px]:grid-cols-2 sm:gap-6 sm:px-0 lg:grid-cols-4">
          <FeatureCard
            icon={Database}
            title="Dynamic Connections"
            description="Connect to any PostgreSQL database and analyze queries in real-time."
          />
          <FeatureCard
            icon={Zap}
            title="AI Optimization"
            description="Llama-3.3 powered query optimization with actionable insights."
          />
          <FeatureCard
            icon={Code}
            title="Explain Plans"
            description="Deep query plan analysis with cost-based optimization suggestions."
          />
          <FeatureCard
            icon={BarChart2}
            title="ML Predictions"
            description="Machine learning powered slow query prediction and risk assessment."
          />
        </div>
      </section>
    </div>
  );
};
