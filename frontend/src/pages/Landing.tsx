import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { Database, Zap, Code, BarChart2 } from 'lucide-react';
import { MagneticButton } from '../components/ui/InteractionLayer';
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
    <SpotlightCard className="mobile-edge-card rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-theme bg-[var(--bg-elevated)]">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-primary sm:text-xl">{title}</h3>
      <p className="text-base leading-relaxed text-muted">{description}</p>
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
      <div className="glass-strong rounded-none border-y border-theme p-5 shadow-glow-cyan sm:rounded-2xl sm:border sm:p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-theme pb-3">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-3 font-mono text-xs text-subtle sm:text-sm">optimizer.sql</span>
        </div>
        <div className="space-y-1.5 font-mono text-sm sm:text-base">
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
          className="mt-4 rounded-lg border border-[var(--success-border)] bg-success-subtle px-3 py-2 text-sm font-medium text-success"
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
    <div className="relative z-10 -mx-4 flex min-h-screen flex-col sm:mx-0">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-80" />

      <section className="relative flex flex-1 flex-col pb-16 sm:pb-24">
        <div className="flex w-full flex-col gap-5 px-4 sm:gap-8 lg:gap-16">
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
              className="mb-4 [&_img]:h-9 sm:mb-5 sm:[&_img]:h-14"
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-theme bg-[var(--bg-glass)] px-3 py-1.5 text-sm font-medium text-muted backdrop-blur-xl">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              {BRAND.tagline} · Powered by Llama-3.3
            </span>
          </motion.div>

          {/* Hero Heading — text-balance on mobile, tighter tracking */}
          <h1 className="text-3xl font-semibold tracking-tighter text-primary sm:text-5xl sm:tracking-tight lg:text-7xl" style={{ textWrap: 'balance' }}>
            <WordReveal text="Engineering-grade" />
            <br />
            <span className="accent-shimmer">
              <WordReveal text="SQL Optimization." />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="max-w-xl text-base leading-relaxed text-muted sm:text-lg"
          >
            Stop guessing about query performance. AutoTune-SQL uses AI and machine learning
            to analyze, optimize, and predict slow queries before they hit production.
          </motion.p>

          {/* CTA Buttons — full-width stacked on mobile, inline on sm+ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex w-full flex-col gap-3 sm:max-w-md sm:flex-row sm:gap-4 lg:max-w-none"
          >
            <MagneticButton
              onClick={() => goToProtectedRoute('/optimizer')}
              className="w-full !rounded-2xl !py-4 !text-base sm:w-auto"
            >
              Get Started
            </MagneticButton>
            <MagneticButton
              variant="secondary"
              onClick={() => goToProtectedRoute('/learn')}
              className="w-full !rounded-2xl !py-4 !text-base sm:w-auto"
            >
              Open Academy
            </MagneticButton>
          </motion.div>

          {/* Hero SQL Graphic — below CTAs on mobile with mask-image fade */}
          <div className="hero-graphic-mask -mx-4 w-[calc(100%+2rem)] lg:hidden">
            <HeroSqlGraphic interactive={false} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            className="flex items-center gap-4 pt-0 sm:gap-8 sm:pt-4"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--bg-base)] bg-[var(--bg-elevated)] text-sm text-primary"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-base text-muted">
              <span className="font-semibold text-primary">500+</span> engineers optimizing daily
            </p>
          </motion.div>

          <div className="hidden lg:block">
            <HeroSqlGraphic />
          </div>
        </div>
      </section>

      <section className="relative pb-20 sm:pb-32">
        <div className="grid grid-cols-1 gap-3 px-4 sm:gap-6 sm:px-0 md:grid-cols-2 lg:grid-cols-4">
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
