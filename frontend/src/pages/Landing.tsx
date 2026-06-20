import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Zap, Code, BarChart2, Menu, X } from 'lucide-react';
import Logo from '../assets/WEBSITE_LOGO.png';
import { MagneticButton } from '../components/ui/InteractionLayer';

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    ref.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      onMouseMove={handleMouseMove}
      className="spotlight-card rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm"
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700/60 bg-zinc-800/60">
        <Icon className="h-6 w-6 text-zinc-100" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-zinc-50">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
    </motion.div>
  );
};

const DatabaseSchemaGraphic = () => {
  return (
    <div className="relative">
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative"
      >
        {/* Main Table */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-zinc-800/60 pb-3">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="ml-3 font-mono text-xs text-zinc-500">users</span>
          </div>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-center gap-3">
              <span className="text-violet-400">id</span>
              <span className="text-zinc-500">SERIAL</span>
              <span className="text-emerald-400">PRIMARY KEY</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-violet-400">name</span>
              <span className="text-zinc-500">VARCHAR</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-violet-400">email</span>
              <span className="text-zinc-500">VARCHAR</span>
              <span className="text-amber-400">UNIQUE</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-violet-400">created_at</span>
              <span className="text-zinc-500">TIMESTAMP</span>
            </div>
          </div>
        </div>

        {/* Second Table (Floating) */}
        <motion.div
          initial={{ x: 30, y: 30, opacity: 0 }}
          whileInView={{ x: 30, y: 30, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="absolute -right-10 top-20 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 shadow-lg backdrop-blur-sm"
        >
          <div className="mb-3 border-b border-zinc-800/60 pb-2">
            <span className="font-mono text-xs text-zinc-500">orders</span>
          </div>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-violet-400">user_id</span>
              <span className="text-blue-400">FOREIGN KEY</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-violet-400">amount</span>
              <span className="text-zinc-500">DECIMAL</span>
            </div>
          </div>
        </motion.div>

        {/* Query Editor */}
        <motion.div
          initial={{ x: -30, y: 40, opacity: 0 }}
          whileInView={{ x: -30, y: 40, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="absolute -left-16 bottom-0 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 shadow-lg backdrop-blur-sm"
        >
          <div className="space-y-1 font-mono text-xs">
            <div>
              <span className="text-zinc-600">1</span> <span className="text-violet-400">SELECT</span> <span className="text-zinc-100">*</span>
            </div>
            <div>
              <span className="text-zinc-600">2</span> <span className="text-violet-400">FROM</span> <span className="text-zinc-200">users</span>
            </div>
            <div>
              <span className="text-zinc-600">3</span> <span className="text-violet-400">JOIN</span> <span className="text-zinc-200">orders</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-6 rounded-full border border-zinc-800/60 bg-zinc-900/60 backdrop-blur-xl px-6 py-3 shadow-2xl"
      >
        {/* Brand Section (Anchor) */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img
            src={Logo}
            alt="AutoTune-SQL"
            className="h-9 w-auto"
          />
          <div className="hidden sm:flex flex-col">
            <span className="text-base font-semibold tracking-tight text-zinc-50">
              AutoTune-SQL
            </span>
            <span className="text-xs text-zinc-400 leading-tight">
              AI SQL Query Optimizer
            </span>
          </div>
        </Link>

        <div className="h-7 w-px bg-zinc-800/60" />

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-2">
          <MagneticButton variant="secondary" onClick={() => navigate('/dashboard')}>
            Dashboard
          </MagneticButton>
          <MagneticButton onClick={() => navigate('/studio')}>
            Open Studio
          </MagneticButton>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md"
          >
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 rounded-2xl p-4 shadow-2xl">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800/70 text-zinc-50 border border-zinc-700/60 text-sm font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    navigate('/studio');
                    setMobileMenuOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-zinc-50 text-zinc-900 text-sm font-semibold"
                >
                  Open Studio
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative z-1">
      <Navbar />

      {/* Hero */}
      <section className="flex-1 flex items-center pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-700/60 bg-zinc-800/40 text-xs text-zinc-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Now powered by Llama-3.3
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-zinc-50"
              >
                Engineering-grade
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
                  SQL Optimization.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-zinc-400 max-w-lg leading-relaxed"
              >
                Stop guessing about your query performance. AutoTune-SQL uses AI
                and machine learning to analyze, optimize, and predict slow queries
                before they hit production.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap items-center gap-4"
              >
                <MagneticButton onClick={() => navigate('/studio')}>
                  Get Started
                </MagneticButton>
                <MagneticButton variant="secondary" onClick={() => navigate('/dashboard')}>
                  View Demo
                </MagneticButton>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center gap-8 pt-4"
              >
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-9 w-9 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-xs text-zinc-200">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-zinc-400">
                  <span className="text-zinc-100 font-semibold">500+</span> engineers optimizing queries daily
                </div>
              </motion.div>
            </div>

            <div className="hidden lg:block">
              <DatabaseSchemaGraphic />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-32">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>
      </section>
    </div>
  );
};
