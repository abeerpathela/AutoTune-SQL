import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import type { ProgressMasterState } from '../types';

type ProgressStats = {
  completedCount: number;
  progressPercent: number;
  totalChapters: number;
};

type ProgressContextValue = {
  completedChapters: string[];
  stats: ProgressStats;
  loading: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  applyMasterState: (state: Partial<ProgressMasterState>) => void;
  markChapterComplete: (chapterId: string) => void;
  isChapterComplete: (chapterId: string) => boolean;
};

const DEFAULT_STATS: ProgressStats = {
  completedCount: 0,
  progressPercent: 0,
  totalChapters: 36,
};

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);
  const [stats, setStats] = useState<ProgressStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const applyMasterState = useCallback((state: Partial<ProgressMasterState>) => {
    if (state.completedChapterIds) {
      setCompletedChapters(state.completedChapterIds);
    } else if (state.updatedChapterId) {
      setCompletedChapters((prev) =>
        prev.includes(state.updatedChapterId!)
          ? prev
          : [...prev, state.updatedChapterId!]
      );
    }

    if (state.completedCount !== undefined || state.progressPercent !== undefined) {
      setStats((prev) => ({
        completedCount: state.completedCount ?? prev.completedCount,
        progressPercent: state.progressPercent ?? prev.progressPercent,
        totalChapters: state.totalChapters ?? prev.totalChapters,
      }));
    }
  }, []);

  const markChapterComplete = useCallback((chapterId: string) => {
    setCompletedChapters((prev) =>
      prev.includes(chapterId) ? prev : [...prev, chapterId]
    );
    setStats((prev) => {
      if (prev.completedCount >= prev.totalChapters) return prev;
      const completedCount = prev.completedCount + 1;
      return {
        ...prev,
        completedCount,
        progressPercent: Math.round((completedCount / prev.totalChapters) * 100),
      };
    });
  }, []);

  const hydrate = useCallback(async () => {
    if (!token) {
      setCompletedChapters([]);
      setStats(DEFAULT_STATS);
      setHydrated(false);
      return;
    }

    setLoading(true);
    try {
      const summary = await api.getProgressSummary();
      applyMasterState(summary);
      setHydrated(true);
    } catch (err) {
      console.error('[ProgressContext] hydrate failed', err);
    } finally {
      setLoading(false);
    }
  }, [token, applyMasterState]);

  useEffect(() => {
    if (token) {
      void hydrate();
    } else {
      setCompletedChapters([]);
      setStats(DEFAULT_STATS);
      setHydrated(false);
    }
  }, [token, hydrate]);

  const isChapterComplete = useCallback(
    (chapterId: string) => completedChapters.includes(chapterId),
    [completedChapters]
  );

  const value = useMemo(
    () => ({
      completedChapters,
      stats,
      loading,
      hydrated,
      hydrate,
      applyMasterState,
      markChapterComplete,
      isChapterComplete,
    }),
    [
      completedChapters,
      stats,
      loading,
      hydrated,
      hydrate,
      applyMasterState,
      markChapterComplete,
      isChapterComplete,
    ]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error('useProgress must be used within ProgressProvider');
  }
  return ctx;
}
