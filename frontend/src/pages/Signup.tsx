import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, Mail, Lock, User, UserPlus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { MagneticButton } from '../components/ui/InteractionLayer';
import { AuthLayout } from '../components/layout/AuthLayout';
import { config } from '../lib/config';
import { BRAND } from '../lib/brand';

export const Signup = () => {
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(formData.email, formData.password, formData.firstName, formData.lastName);
      toast.success(`Welcome to ${BRAND.name}!`);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Create account"
      subheading={`Join ${BRAND.name} and start optimizing`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="label-field">
              First name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input-field"
                placeholder="John"
              />
            </div>
          </div>
          <div>
            <label htmlFor="lastName" className="label-field">
              Last name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input-field"
                placeholder="Doe"
              />
            </div>
          </div>
        </div>

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
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-field"
              placeholder="Min. 6 characters"
            />
          </div>
        </div>

        <MagneticButton type="submit" disabled={loading} className="group !w-full !py-3.5">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
              Creating account…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <UserPlus className="h-5 w-5" />
              Join {BRAND.name}
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
          window.location.href = config.githubOAuthUrl;
        }}
      >
        <Github className="mr-2 h-5 w-5" />
        GitHub
      </MagneticButton>

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="link-accent">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};
