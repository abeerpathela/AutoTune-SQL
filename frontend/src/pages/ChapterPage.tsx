import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import {
  Check,
  BookOpen,
  CheckCircle,
  ChevronRightCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { VideoPlayer, type VideoWatchStats } from '../components/academy/VideoPlayer';
import { AcademySidebar } from '../components/academy/Sidebar';
import {
  ChapterContentSkeleton,
  ChapterHeaderSkeleton,
  SidebarSkeleton,
} from '../components/academy/ChapterSkeleton';
import { PracticeLab } from '../components/academy/PracticeLab';
import { extractYouTubeId } from '../utils/youtube';
import { Quiz } from '../components/academy/Quiz';
import { api } from '../lib/api';
import Logo from '../assets/WEBSITE_LOGO.svg';
import { useProgress } from '../contexts/ProgressContext';
import type { Chapter, ChapterContent, QuizQuestion, QuizSubmitResult } from '../types';

const TOTAL_CHAPTERS = 36;

export const ChapterPage = () => {
  const { order } = useParams<{ order: string }>();
  const navigate = useNavigate();
  const chapterOrder = parseInt(order ?? '1', 10);

  const [catalog, setCatalog] = useState<Chapter[]>([]);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [content, setContent] = useState<ChapterContent | null>(null);
  const { stats, applyMasterState, markChapterComplete, isChapterComplete, hydrate } = useProgress();
  const totalProgress = stats.progressPercent;
  const completedCount = stats.completedCount;
  const [catalogReady, setCatalogReady] = useState(false);
  const [contentLoading, setContentLoading] = useState(true);
  const [completingVideo, setCompletingVideo] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [watchStats, setWatchStats] = useState<VideoWatchStats | null>(null);
  const lastSyncedPercentRef = useRef(0);
  const syncInFlightRef = useRef(false);

  const loadCatalog = useCallback(async () => {
    const catalogRes = await api.getAcademyCatalog();
    setCatalog(catalogRes.chapters);
    const ch = catalogRes.chapters.find((c) => c.globalOrder === chapterOrder) ?? null;
    setChapter(ch);
    setCatalogReady(true);
    return ch;
  }, [chapterOrder]);

  const loadContent = useCallback(async (chapterId: string) => {
    setContentLoading(true);
    setContent(null);
    setWatchStats(null);
    lastSyncedPercentRef.current = 0;

    try {
      const data = await api.getChapterContent(chapterId);
      setContent(data);
      const savedPercent = data.progress?.videoWatchPercent ?? data.status?.videoWatchPercent ?? 0;
      if (savedPercent >= 95) {
        setWatchStats({
          maxWatchPercent: savedPercent,
          maxTimeWatched: 0,
          duration: 0,
          completionReady: true,
          canMarkComplete: savedPercent >= 80,
        });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { redirectOrder?: number } } };
      if (axiosErr.response?.status === 403) {
        const redirect = axiosErr.response.data?.redirectOrder ?? 1;
        toast.error('Complete the previous chapter first.');
        navigate(`/learn/chapter/${redirect}`, { replace: true });
      }
    } finally {
      setContentLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (catalog.length === 0) setCatalogReady(false);

      try {
        const ch = await loadCatalog();
        if (cancelled || !ch) return;
        await loadContent(ch.id);
      } catch {
        if (!cancelled) toast.error('Failed to load academy data');
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [chapterOrder, loadCatalog, loadContent, catalog.length]);

  const syncWatchProgress = useCallback(
    async (stats: VideoWatchStats) => {
      if (!chapter || chapter.type !== 'VIDEO' || syncInFlightRef.current) return;
      const vid = extractYouTubeId(chapter.videoUrl);
      if (!vid) return;

      const shouldSync =
        stats.maxWatchPercent >= 80 &&
        stats.maxWatchPercent > lastSyncedPercentRef.current + 4;

      if (!shouldSync && !stats.completionReady) return;

      syncInFlightRef.current = true;
      try {
        await api.markVideoWatched(chapter.id, vid, stats.maxWatchPercent);
        lastSyncedPercentRef.current = stats.maxWatchPercent;
      } catch {
        /* non-blocking */
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [chapter]
  );

  const handleWatchUpdate = useCallback(
    (stats: VideoWatchStats) => {
      setWatchStats(stats);
      void syncWatchProgress(stats);
    },
    [syncWatchProgress]
  );

  const optimisticMarkComplete = useCallback(() => {
    if (!chapter) return;
    markChapterComplete(chapter.id);
    setChapter((prev) =>
      prev ? { ...prev, isCompleted: true } : prev
    );
  }, [chapter, markChapterComplete]);

  const handleMarkVideoComplete = async () => {
    if (!chapter || chapter.type !== 'VIDEO') return;
    const vid = extractYouTubeId(chapter.videoUrl);
    if (!vid) {
      toast.error('No video configured for this chapter.');
      return;
    }

    const maxWatchPercent = watchStats?.maxWatchPercent ?? chapter.progress?.videoWatchPercent ?? 0;
    if (maxWatchPercent < 80) {
      toast.error('Watch at least 80% of the video without skipping.');
      return;
    }

    optimisticMarkComplete();
    setCompletingVideo(true);

    try {
      const result = await api.completeVideo(chapter.id, vid, maxWatchPercent);
      applyMasterState(result);
      toast.success('Video Complete ✓');
      api.invalidateAcademyCatalog();
      const catalogRes = await api.getAcademyCatalog(true);
      setCatalog(catalogRes.chapters);
      setChapter((prev) =>
        prev ? { ...prev, isCompleted: true } : prev
      );
    } catch (err: unknown) {
      await hydrate();
      api.invalidateAcademyCatalog();
      await loadCatalog();
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to save video progress');
    } finally {
      setCompletingVideo(false);
    }
  };

  const handleQuizSubmit = async (answers: number[]): Promise<QuizSubmitResult> => {
    if (!chapter) {
      return {
        passed: false,
        score: 0,
        nextChapterId: null,
        progress: {
          videoWatched: false,
          videoCompleted: false,
          quizScore: 0,
          quizAttempts: 0,
          focusViolations: 0,
          isCompleted: false,
          isUnlocked: true,
        },
      };
    }
    const result = await api.submitChapterQuiz(chapter.id, answers);
    if (result.passed && result.completedCount !== undefined) {
      applyMasterState(result);
    }
    return result;
  };

  const handleQuizComplete = (result: QuizSubmitResult) => {
    setQuizActive(false);
    navigate(`/learn/chapter/${chapterOrder}/quiz-result`, {
      state: {
        result,
        chapterId: chapter?.id,
        chapterOrder,
        chapterTitle: chapter?.title,
        questions: content?.quiz?.questions,
      },
    });
  };

  if (!catalogReady) {
    return (
      <div className="space-y-6">
        <ChapterHeaderSkeleton />
        <div className="grid lg:grid-cols-4 gap-6">
          <SidebarSkeleton />
          <div className="lg:col-span-3">
            <ChapterContentSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="text-center py-20 text-zinc-400">
        Chapter not found.
      </div>
    );
  }

  const progress = chapter.progress ?? content?.progress;
  const chapterStatus = chapter.status ?? content?.status ?? progress;
  const questions: QuizQuestion[] = content?.quiz?.questions ?? [];
  const theoryContent = content?.theoryContent ?? '';
  const isVideo = chapter.type === 'VIDEO';
  const isTheory = chapter.type === 'THEORY';
  const videoId = isVideo ? extractYouTubeId(chapter.videoUrl) : null;
  const isChapterCompleted = chapter ? isChapterComplete(chapter.id) : false;
  const savedWatchPercent =
    watchStats?.maxWatchPercent ??
    chapter.progress?.videoWatchPercent ??
    chapterStatus?.videoWatchPercent ??
    0;
  const completionReady =
    watchStats?.completionReady ||
    savedWatchPercent >= 95 ||
    chapterStatus?.videoWatched ||
    progress?.videoWatched;
  const canMarkVideoComplete =
    isVideo &&
    completionReady &&
    !isChapterCompleted &&
    (watchStats?.canMarkComplete ?? savedWatchPercent >= 80);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <img src={Logo} alt="AutoTune-SQL" className="h-12 w-auto shrink-0 hidden sm:block" />
          <div>
            <p className="text-sm text-violet-400 font-medium">{chapter.moduleTitle}</p>
            <h1 className="text-3xl font-bold text-zinc-100 mt-1">AutoTune Academy</h1>
            <p className="text-zinc-400 mt-1">
              Chapter {chapter.globalOrder} of {TOTAL_CHAPTERS} · {completedCount} completed
            </p>
          </div>
        </div>
        <div className="w-full sm:w-72">
          <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-600 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1 text-right">{totalProgress}% course progress</p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        <AcademySidebar
          catalog={catalog}
          activeGlobalOrder={chapter.globalOrder ?? chapterOrder}
          quizActive={quizActive}
        />

        <main className="lg:col-span-3 space-y-6">
          {contentLoading ? (
            <ChapterContentSkeleton isVideo={isVideo} />
          ) : (
            <>
              <h2 className="text-2xl font-bold text-zinc-100">{chapter.title}</h2>

              {isVideo && (
                <div className="space-y-4">
                  <VideoPlayer
                    key={chapter.id}
                    videoId={videoId}
                    initialWatchPercent={savedWatchPercent}
                    onWatchUpdate={handleWatchUpdate}
                  />

                  {theoryContent && (
                    <div className="prose prose-invert prose-sm max-w-none rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
                      <ReactMarkdown>{theoryContent}</ReactMarkdown>
                    </div>
                  )}

                  <PracticeLab chapterTitle={chapter.title} practiceLab={content?.practiceLab} />

                  {!isChapterCompleted && (
                    <>
                      {!canMarkVideoComplete && (
                        <p className="text-center text-sm text-zinc-500">
                          Please watch the full video to unlock completion.
                        </p>
                      )}
                      <motion.button
                        onClick={handleMarkVideoComplete}
                        disabled={completingVideo || !canMarkVideoComplete}
                        animate={
                          canMarkVideoComplete
                            ? {
                                boxShadow: [
                                  '0 0 0px rgba(228,228,231,0)',
                                  '0 0 20px rgba(228,228,231,0.35)',
                                  '0 0 0px rgba(228,228,231,0)',
                                ],
                              }
                            : undefined
                        }
                        transition={canMarkVideoComplete ? { repeat: Infinity, duration: 2 } : undefined}
                        whileHover={canMarkVideoComplete ? { scale: 1.01 } : undefined}
                        whileTap={canMarkVideoComplete ? { scale: 0.99 } : undefined}
                        className={`w-full py-4 rounded-lg text-lg font-bold flex items-center justify-center gap-2 transition-colors ${
                          canMarkVideoComplete
                            ? 'bg-gradient-to-r from-zinc-200 to-zinc-500 text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                            : 'border border-zinc-700 bg-zinc-800/60 text-zinc-500 cursor-not-allowed'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <CheckCircle className="w-5 h-5" />
                        {completingVideo ? 'Saving…' : 'Mark Video Complete'}
                      </motion.button>
                    </>
                  )}

                  {isChapterCompleted && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
                    >
                      <Check className="w-5 h-5" />
                      Video Complete ✓
                    </motion.div>
                  )}

                  {!isChapterCompleted && questions.length > 0 && (
                    <Quiz
                      chapterId={chapter.id}
                      chapterOrder={chapterOrder}
                      questions={questions}
                      disabled={isChapterCompleted}
                      onSubmit={handleQuizSubmit}
                      onComplete={handleQuizComplete}
                      onActiveChange={setQuizActive}
                    />
                  )}
                </div>
              )}

              {isTheory && (
                <>
                  <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-lg font-semibold text-zinc-100">Detailed Theory</h3>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{theoryContent}</ReactMarkdown>
                    </div>
                  </section>

                  <PracticeLab chapterTitle={chapter.title} practiceLab={content?.practiceLab} />

                  {!isChapterCompleted && questions.length > 0 && (
                    <Quiz
                      chapterId={chapter.id}
                      chapterOrder={chapterOrder}
                      questions={questions}
                      disabled={isChapterCompleted}
                      onSubmit={handleQuizSubmit}
                      onComplete={handleQuizComplete}
                      onActiveChange={setQuizActive}
                    />
                  )}
                </>
              )}

              {isChapterCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 text-center space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Check className="w-10 h-10 text-emerald-400 mx-auto" />
                  </motion.div>
                  <p className="text-emerald-200 font-semibold">Chapter complete!</p>
                  {chapterOrder < TOTAL_CHAPTERS && chapter && isChapterComplete(chapter.id) ? (
                    <button
                      onClick={() => navigate(`/learn/chapter/${chapterOrder + 1}`)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600"
                    >
                      Next Chapter
                      <ChevronRightCircle className="w-5 h-5" />
                    </button>
                  ) : null}
                </motion.div>
              )}

              {chapterOrder < TOTAL_CHAPTERS && chapter && !isChapterComplete(chapter.id) && (
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-zinc-800/80 text-zinc-500 font-medium cursor-not-allowed border border-zinc-700/50"
                >
                  Next Chapter — complete this chapter first
                </button>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
