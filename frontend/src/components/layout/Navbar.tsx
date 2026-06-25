import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { MagneticButton } from '../ui/InteractionLayer';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import { BRAND } from '../../lib/brand';
import { buildLoginPath } from '../../lib/redirect';
import { UserGreeting } from '../UserGreeting';

type NavItem = { to: string; label: string; icon?: LucideIcon };

/* Stagger animation config for full-screen menu */
const menuItemVariants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      delay: 0.08 + i * 0.06,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
  const isLanding = location.pathname === '/';

  const { scrollY } = useScroll();
  const pillScale = useTransform(scrollY, [0, 120], [1, isLanding ? 0.96 : 0.92]);
  const pillY = useTransform(scrollY, [0, 120], [0, -2]);
  const navOpacity = useTransform(scrollY, [0, 80], [isLanding ? 0.92 : 1, 1]);

  const navItems: NavItem[] = user
    ? [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
      { to: '/connections', icon: Database, label: 'Connections' },
      { to: '/optimizer', icon: Zap, label: 'Optimizer' },
      { to: '/learn', icon: GraduationCap, label: 'Academy' },
      { to: '/certificates', icon: Award, label: 'Certificates' },
      ...(user.role === 'ADMIN'
        ? [{ to: '/ml-stats', icon: Shield, label: 'Admin' }]
        : []),
    ]
    : isLanding
      ? []
      : [
        { to: '/', label: 'Home' },
        { to: '/login', label: 'Sign In' },
      ];

  const guestAuthItems: NavItem[] =
    hasToken && !user && !isLanding
      ? [
        { to: '/optimizer', icon: Zap, label: 'Optimizer' },
        { to: '/learn', icon: GraduationCap, label: 'Academy' },
      ]
      : [];

  const allNavItems = [...navItems, ...guestAuthItems];

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const shellClass = isLanding
    ? scrolled
      ? 'nav-landing-scrolled border'
      : 'nav-landing border border-transparent'
    : 'glass-strong border border-theme shadow-[0_12px_40px_rgba(0,0,0,0.12)]';

  /* Build combined items for the fullscreen menu (landing + nav items) */
  const mobileMenuItems: NavItem[] = [];
  if (isLanding && !user) {
    mobileMenuItems.push(
      { to: buildLoginPath('/optimizer'), icon: Zap, label: 'Optimizer' },
      { to: buildLoginPath('/learn'), icon: GraduationCap, label: 'Academy' },
      { to: buildLoginPath('/dashboard'), icon: LayoutDashboard, label: 'Dashboard' },
    );
  }
  mobileMenuItems.push(...allNavItems);

  return (
    <>
      {/* ─── Fixed-Top Floating Pill Navbar ─── */}
      <motion.div
        style={{ opacity: navOpacity }}
        className={`fixed top-0 left-0 right-0 z-50 ${isLanding ? 'pt-4' : 'pt-3 sm:pt-4'}`}
      >
        <div className="mx-auto w-[92%] max-w-6xl sm:w-full sm:px-4">
          <motion.div
            style={{ scale: pillScale, y: pillY }}
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 transition-all duration-300 sm:gap-3 sm:rounded-full sm:px-4 sm:py-2.5 ${shellClass}`}
          >
            {/* Landing: icon-only to avoid duplicating hero branding */}
            {isLanding ? (
              <Link to="/" className="interactive-target shrink-0 rounded-lg p-0.5 sm:p-1">
                <img
                  src={BRAND.logo}
                  alt="AutoTune-SQL"
                  className="h-7 w-auto max-w-[110px] object-contain sm:h-9 sm:max-w-none"
                />
              </Link>
            ) : (
              <Logo
                size="md"
                showText
                showTagline
                to={user ? '/dashboard' : '/'}
                className="!gap-2 [&_img]:h-7 [&_img]:max-w-[100px] sm:[&_img]:h-10 sm:[&_img]:max-w-none"
              />
            )}

            {!isLanding && <div className="hidden h-6 w-px bg-[var(--border)] lg:block" />}

            {user && !isLanding && (
              <p className="hidden max-w-[220px] truncate text-xs text-muted xl:block">
                <UserGreeting user={user} variant="inline" />
              </p>
            )}

            {!isLanding && (
              <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
                {allNavItems.map((item) => {
                  const active =
                    location.pathname === item.to ||
                    (item.to === '/learn' && location.pathname.startsWith('/learn'));
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`interactive-target relative flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${active
                          ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-primary shadow-[inset_0_0_0_1px_var(--border-strong)]'
                          : 'text-muted hover:bg-[var(--accent-glow)] hover:text-primary'
                        }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 to-violet-500/10"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative flex items-center gap-2">
                        {item.icon && <item.icon className="h-3.5 w-3.5" />}
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Landing: subtle tagline in nav center on desktop */}
            {isLanding && (
              <p className="hidden flex-1 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-subtle lg:block">
                ML-Driven Query Optimizer
              </p>
            )}

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <div className="hidden md:block">
                {user ? (
                  <button
                    onClick={logout}
                    className="interactive-target flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-muted transition-colors hover:text-primary"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                ) : (
                  !location.pathname.includes('/login') &&
                  !location.pathname.includes('/signup') && (
                    <MagneticButton
                      variant={isLanding ? 'gradient' : 'primary'}
                      onClick={() => navigate('/login')}
                      className="group !px-5 !py-2 !text-xs"
                    >
                      <span className="flex items-center gap-1.5">
                        Get Started
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </MagneticButton>
                  )
                )}
              </div>
              <ThemeToggle />
              {(allNavItems.length > 0 || isLanding) && (
                <motion.button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  whileTap={{ scale: 0.96 }}
                  className="interactive-target rounded-full p-2.5 text-muted hover:text-primary lg:hidden"
                  aria-label="Toggle menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ─── Full-Screen Blur Menu (Mobile) ─── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-2xl lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Full-screen menu content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[70] flex flex-col lg:hidden"
            >
              {/* Close button */}
              <div className="flex justify-end px-6 pt-5">
                <motion.button
                  onClick={() => setIsMobileMenuOpen(false)}
                  whileTap={{ scale: 0.96 }}
                  className="rounded-full bg-white/10 p-3 text-white backdrop-blur-sm"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>

              {/* Brand */}
              <div className="px-8 pt-4 pb-6">
                <img src={BRAND.logo} alt="AutoTune-SQL" className="h-8 w-auto object-contain brightness-0 invert" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Navigate
                </p>
              </div>

              {/* Stagger-animated menu items */}
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 pb-8">
                {mobileMenuItems.map((item, i) => {
                  const active =
                    location.pathname === item.to ||
                    (item.to === '/learn' && location.pathname.startsWith('/learn'));
                  return (
                    <motion.div
                      key={item.to}
                      custom={i}
                      variants={menuItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <Link
                        to={item.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-lg font-semibold transition-colors ${
                          active
                            ? 'bg-white/10 text-white'
                            : 'text-zinc-300 active:bg-white/5'
                        }`}
                      >
                        {item.icon && <item.icon className="h-6 w-6 shrink-0" />}
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Divider + Auth action */}
                <motion.div
                  custom={mobileMenuItems.length}
                  variants={menuItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="mt-4 border-t border-white/10 pt-4"
                >
                  {user ? (
                    <motion.button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      whileTap={{ scale: 0.96 }}
                      className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-lg font-medium text-zinc-400 active:bg-white/5"
                    >
                      <LogOut className="h-6 w-6" />
                      Logout
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        navigate('/login');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 py-4 text-lg font-bold text-white shadow-lg shadow-cyan-500/20"
                    >
                      Get Started
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  )}
                </motion.div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
