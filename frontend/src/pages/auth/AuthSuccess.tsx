import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type AuthSuccessPhase = 'processing' | 'success' | 'error';

export const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const handled = useRef(false);
  const [phase, setPhase] = useState<AuthSuccessPhase>('processing');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setPhase('error');
      const timer = setTimeout(() => navigate('/login', { replace: true }), 1500);
      return () => clearTimeout(timer);
    }

    if (handled.current) return;
    handled.current = true;

    const establishSession = async () => {
      try {
        await login(token);
        setPhase('success');

        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      } catch (err) {
        console.error(err);
        localStorage.removeItem('token');
        setPhase('error');
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      }
    };

    establishSession();
  }, [searchParams, login, navigate]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      {phase === 'processing' && (
        <>
          <div
            className="mb-6 h-10 w-10 animate-spin rounded-full border-[3px] border-zinc-700 border-t-zinc-300"
            aria-hidden
          />
          <h1 className="text-lg font-semibold text-zinc-100">Processing Login…</h1>
          <p className="mt-2 text-sm text-zinc-500">Securing your session</p>
        </>
      )}

      {phase === 'success' && (
        <>
          <CheckCircle2 className="mb-4 h-10 w-10 text-emerald-400" aria-hidden />
          <h1 className="text-lg font-semibold text-zinc-100">Success</h1>
          <p className="mt-2 text-sm text-zinc-500">Redirecting to your dashboard…</p>
        </>
      )}

      {phase === 'error' && (
        <>
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm font-semibold text-zinc-400">
            !
          </div>
          <h1 className="text-lg font-semibold text-zinc-100">Login failed</h1>
          <p className="mt-2 text-sm text-zinc-500">Returning to sign in…</p>
        </>
      )}
    </div>
  );
};
