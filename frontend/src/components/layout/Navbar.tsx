import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Zap,
  GraduationCap,
  Award,
  Menu,
  X,
  LogOut,
  Shield,
  Database,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Logo from '../../assets/WEBSITE_LOGO.svg';
import { MagneticButton } from '../ui/InteractionLayer';
import { useAuth } from '../../contexts/AuthContext';

type NavItem = { to: string; label: string; icon?: LucideIcon };

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');

  const navItems: NavItem[] = user
    ? [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { to: '/connections', icon: Database, label: 'Connections' },
        { to: '/optimizer', icon: Zap, label: 'Optimizer' },
        { to: '/learn/chapter/1', icon: GraduationCap, label: 'Learn' },
        { to: '/certificates', icon: Award, label: 'Certificates' },
        ...(user.role === 'ADMIN'
          ? [{ to: '/ml-stats', icon: Shield, label: 'Admin' }]
          : []),
      ]
    : [{ to: '/', label: 'Home' }];

  const guestAuthItems: NavItem[] =
    hasToken && !user
      ? [
          { to: '/optimizer', icon: Zap, label: 'Optimizer' },
          { to: '/learn/chapter/1', icon: GraduationCap, label: 'Learn' },
        ]
      : [];

  const allNavItems = [...navItems, ...guestAuthItems];

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-6 rounded-full border border-zinc-800/60 bg-zinc-900/60 backdrop-blur-xl px-6 py-3 shadow-2xl"
      >
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src={Logo} alt="AutoTune-SQL" className="h-9 w-auto" />
          <div className="hidden sm:flex flex-col">
            <span className="text-base font-semibold tracking-tight text-zinc-100">AutoTune-SQL</span>
            <span className="text-xs text-zinc-400 leading-tight">AI SQL Query Optimizer</span>
          </div>
        </Link>

        <div className="h-7 w-px bg-zinc-800/60" />

        <nav className="hidden md:flex items-center gap-1">
          {allNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                location.pathname === item.to
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
              }`}
            >
              {item.icon && <item.icon className="w-4.5 h-4.5" />}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-all"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          ) : (
            <MagneticButton onClick={() => navigate('/login')}>Sign In</MagneticButton>
          )}
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </motion.div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-2 w-[calc(100vw-2rem)] max-w-md bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/60 rounded-2xl p-4 shadow-2xl"
          >
            <nav className="flex flex-col gap-2">
              {allNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                    location.pathname === item.to
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                  }`}
                >
                  {item.icon && <item.icon className="w-4.5 h-4.5" />}
                  {item.label}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-all text-sm font-medium"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  Logout
                </button>
              ) : (
                <MagneticButton
                  onClick={() => {
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  Sign In
                </MagneticButton>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
