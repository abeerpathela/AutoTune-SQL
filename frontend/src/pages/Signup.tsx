import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Mail, Lock, User, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { MagneticButton } from '../components/ui/InteractionLayer';
import { config } from '../lib/config';

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
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="spotlight-card rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">Create Account</h1>
            <p className="text-zinc-400">Start optimizing your SQL queries today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-800/40 border border-zinc-700/60 rounded-xl text-zinc-100 focus:outline-none focus:border-violet-500/60 transition-colors"
                    placeholder="John"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-800/40 border border-zinc-700/60 rounded-xl text-zinc-100 focus:outline-none focus:border-violet-500/60 transition-colors"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800/40 border border-zinc-700/60 rounded-xl text-zinc-100 focus:outline-none focus:border-violet-500/60 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800/40 border border-zinc-700/60 rounded-xl text-zinc-100 focus:outline-none focus:border-violet-500/60 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <MagneticButton
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin mr-2" />
              ) : (
                <UserPlus className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Creating account...' : 'Sign Up'}
            </MagneticButton>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-zinc-900/40 text-zinc-500">Or continue with</span>
            </div>
          </div>

          <MagneticButton
            variant="secondary"
            className="w-full"
            onClick={() => { window.location.href = config.githubOAuthUrl; }}
          >
            <Github className="w-5 h-5 mr-2" />
            GitHub OAuth
          </MagneticButton>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
