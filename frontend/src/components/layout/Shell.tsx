import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Clock,
  Brain,
  Database,
  Menu,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../../assets/WEBSITE_LOGO.svg';

const NavItem = ({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
  active: boolean;
}) => (
  <Link
    to={to}
    className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 ${
      active
        ? 'bg-zinc-800 text-zinc-50 border border-zinc-700/60 shadow-sm'
        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
    }`}
  >
    <Icon className="w-4.5 h-4.5" />
    <span className="text-sm font-medium">{label}</span>
  </Link>
);

export const Shell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/connections', icon: Database, label: 'Connections' },
    { to: '/studio', icon: Zap, label: 'Studio' },
    { to: '/history', icon: Clock, label: 'History' },
    { to: '/ml-stats', icon: Brain, label: 'ML Stats' },
  ];

  return (
    <div className="min-h-screen text-zinc-50 relative z-1">
      {/* Floating Navbar with Enhanced Branding */}
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
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                active={location.pathname === item.to}
              />
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </motion.div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md"
          >
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 rounded-2xl p-4 shadow-2xl">
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <NavItem
                    key={item.to}
                    {...item}
                    active={location.pathname === item.to}
                  />
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-36 px-6 pb-12 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};
