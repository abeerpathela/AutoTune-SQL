import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ChapterHeaderSkeleton, SidebarSkeleton } from '../components/academy/ChapterSkeleton';

/**
 * Hydrates catalog before routing — no chapter UI until progress is merged from DB.
 */
export const Academy = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const resume = async () => {
      try {
        const { chapters, resumeOrder } = await api.getAcademyCatalog(true);
        if (cancelled) return;

        const sorted = [...chapters].sort(
          (a, b) => (a.globalOrder ?? 0) - (b.globalOrder ?? 0)
        );
        const firstIncomplete = sorted.find((ch) => ch.isCompleted !== true);
        const targetOrder = firstIncomplete?.globalOrder ?? resumeOrder ?? 1;
        navigate(`/learn/chapter/${targetOrder}`, { replace: true });
      } catch {
        if (!cancelled) navigate('/learn/chapter/1', { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void resume();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <ChapterHeaderSkeleton />
        <div className="grid lg:grid-cols-4 gap-6">
          <SidebarSkeleton />
          <div className="lg:col-span-3 h-[400px] animate-pulse bg-zinc-800/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  return null;
};
