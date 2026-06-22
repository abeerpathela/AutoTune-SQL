import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Github, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { MagneticButton } from '../components/ui/InteractionLayer';
import { AuthLayout } from '../components/layout/AuthLayout';
import { config } from '../lib/config';
import { BRAND } from '../lib/brand';
import { getAuthCallback, storeOAuthCallback } from '../lib/redirect';
import { isNewUser } from '../components/UserGreeting';

export const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const callbackTo = getAuthCallback(searchParams);
  const signupPath = searchParams.get('callback') || searchParams.get('redirect')
    ? `/signup?callback=${encodeURIComponent(searchParams.get('callback') || searchParams.get('redirect')!)}`
    : '/signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedInUser = await login(formData.email, formData.password);
      toast.success(
        loggedInUser && isNewUser(loggedInUser)
          ? `Welcome to ${BRAND.name}!`
          : `Welcome back to ${BRAND.name}!`
      );
      navigate(callbackTo, { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Sign in"
      subheading={`Access your ${BRAND.name} workspace`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="label-field">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              placeholder="you@company.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="label-field">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-field"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <MagneticButton type="submit" disabled={loading} className="group !w-full !py-3.5">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
              Signing in…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign in to {BRAND.name}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </MagneticButton>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-theme" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-[var(--bg-elevated)] px-3 text-subtle">or continue with</span>
        </div>
      </div>

      <MagneticButton
        variant="secondary"
        className="!w-full !py-3.5"
        onClick={() => {
          storeOAuthCallback(callbackTo);
          window.location.href = config.githubOAuthUrl;
        }}
      >
        <Github className="mr-2 h-5 w-5" />
        GitHub
      </MagneticButton>

      <p className="mt-8 text-center text-sm text-muted">
        New to {BRAND.name}?{' '}
        <Link to={signupPath} className="link-accent">
          Create free account
        </Link>
      </p>
    </AuthLayout>
  );
};
