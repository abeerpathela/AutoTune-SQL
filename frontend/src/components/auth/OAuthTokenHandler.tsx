import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

/** Captures ?token= from GitHub OAuth redirect and establishes the session. */
export const OAuthTokenHandler = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token || handled.current) return;

    handled.current = true;

    const establishSession = async () => {
      try {
        await login(token);
        toast.success('Logged in with GitHub successfully!');

        searchParams.delete('token');
        setSearchParams(searchParams, { replace: true });
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error(err);
        localStorage.removeItem('token');
        toast.error('Failed to complete GitHub login');
        navigate('/login', { replace: true });
      }
    };

    establishSession();
  }, [searchParams, setSearchParams, login, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin h-8 w-8 border-4 border-zinc-700 border-t-violet-500 rounded-full" />
    </div>
  );
};
