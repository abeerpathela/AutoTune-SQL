import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Editor from '@monaco-editor/react';
import {
  Check,
  Lock,
  Play,
  ChevronRight,
  Sparkles,
  FlaskConical,
  ClipboardCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import type { Chapter, QuizQuestion } from '../types';

const TOTAL_CHAPTERS = 30;

export const Academy = () => {
  const { order } = useParams<{ order?: string }>();
  const navigate = useNavigate();
  const chapterOrder = order ? parseInt(order, 10) : 1;

  const [catalog, setCatalog] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [practiceSql, setPracticeSql] = useState('');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCatalog = useCallback(async () => {
    const data = await api.getAcademyCatalog();
    setCatalog(data);
    return data;
  }, []);

  const loadChapter = useCallback(
    async (globalOrder: number) => {
      try {
        const chapter = await api.getChapterByOrder(globalOrder);
        setActiveChapter(chapter);
        setPracticeSql(chapter.practiceSql || 'SELECT 1;');
        setQuizAnswers({});
        if (!chapter.progress?.isWatched) {
          await api.markChapterWatched(chapter.id);
        }
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number; data?: { redirectOrder?: number } } };
        if (axiosErr.response?.status === 403) {
          const redirect = axiosErr.response.data?.redirectOrder ?? Math.max(1, globalOrder - 1);
          toast.error('Please complete previous chapters first.');
          navigate(`/learn/chapter/${redirect}`, { replace: true });
        }
        throw err;
      }
    },
    [navigate]
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadCatalog();
        if (!order) {
          navigate('/learn/chapter/1', { replace: true });
          return;
        }
        await loadChapter(chapterOrder);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [chapterOrder, order, navigate, loadCatalog, loadChapter]);

  const handleSelectChapter = (ch: Chapter) => {
    if (!ch.progress?.isUnlocked) {
      toast.error('Complete the previous chapter quiz (≥80%) to unlock.');
      return;
    }
    navigate(`/learn/chapter/${ch.globalOrder}`);
  };

  const handleMarkExercise = async () => {
    if (!activeChapter) return;
    try {
      await api.markExerciseCompleted(activeChapter.id);
      toast.success('Practice lab marked complete!');
      await loadCatalog();
      await loadChapter(chapterOrder);
    } catch {
      toast.error('Failed to save exercise progress');
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeChapter?.quiz?.questions && !activeChapter?.quizId) return;
    const questions: QuizQuestion[] = activeChapter.quiz?.questions || [];
    if (questions.length === 0) return;

    const answers = questions.map((_, i) => quizAnswers[i] ?? -1);
    if (answers.some((a) => a < 0)) {
      toast.error('Please answer all 20 questions before submitting.');
      return;
    }

    setSubmittingQuiz(true);
    try {
      const quizId = activeChapter.quiz?.id || activeChapter.quizId!;
      const result = await api.evaluateQuiz(quizId, answers);
      if (result.passed) {
        toast.success(`Quiz passed with ${result.score}%! Next chapter unlocked.`);
        await loadCatalog();
        if (result.nextChapterUnlocked && chapterOrder < TOTAL_CHAPTERS) {
          navigate(`/learn/chapter/${chapterOrder + 1}`);
        }
      } else {
        toast.error(`Score ${result.score}% — need ${result.passThreshold}% to pass.`);
        await loadCatalog();
        await loadChapter(chapterOrder);
      }
    } catch {
      toast.error('Quiz submission failed');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading || !activeChapter) {
    return (
      <div className="space-y-8">
        <div className="animate-shimmer h-12 w-64 bg-zinc-800/40 rounded-xl" />
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="animate-shimmer h-[600px] bg-zinc-800/40 rounded-2xl" />
          <div className="lg:col-span-3 animate-shimmer h-[600px] bg-zinc-800/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  const questions: QuizQuestion[] = activeChapter.quiz?.questions || [];
  const completedCount = catalog.filter((c) => c.progress?.isCompleted).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-violet-400 font-medium">{activeChapter.moduleTitle}</p>
          <h1 className="text-3xl font-bold text-zinc-100 mt-1">SQL Academy · Lecture Hall</h1>
          <p className="text-zinc-400 mt-1">
            Chapter {activeChapter.globalOrder} of {TOTAL_CHAPTERS} · {completedCount} completed
          </p>
        </div>
        <div className="w-full sm:w-64">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all"
              style={{ width: `${(completedCount / TOTAL_CHAPTERS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar stepper */}
        <aside className="lg:col-span-1 max-h-[80vh] overflow-y-auto pr-1 space-y-4">
          {Array.from(new Set(catalog.map((c) => c.moduleTitle))).map((moduleTitle) => (
            <div key={moduleTitle}>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">
                {moduleTitle}
              </h3>
              <div className="space-y-1">
                {catalog
                  .filter((c) => c.moduleTitle === moduleTitle)
                  .map((ch) => {
                    const unlocked = ch.progress?.isUnlocked ?? ch.globalOrder === 1;
                    const completed = ch.progress?.isCompleted;
                    const isActive = ch.globalOrder === activeChapter.globalOrder;

                    return (
                      <button
                        key={ch.id}
                        onClick={() => handleSelectChapter(ch)}
                        disabled={!unlocked}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          isActive
                            ? 'bg-violet-500/20 border border-violet-500/40 text-violet-200'
                            : unlocked
                            ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                            : 'text-zinc-600 cursor-not-allowed opacity-60'
                        }`}
                      >
                        {completed ? (
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : unlocked ? (
                          <Play className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{ch.globalOrder}. {ch.title}</p>
                          {ch.progress?.quizScore != null && (
                            <p className="text-[10px] text-zinc-500">Quiz: {ch.progress.quizScore}%</p>
                          )}
                        </div>
                        {isActive && <ChevronRight className="w-4 h-4" />}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </aside>

        {/* Main lecture hall */}
        <main className="lg:col-span-3 space-y-6">
          {/* Video */}
          <section className="rounded-2xl overflow-hidden border border-zinc-800/60 bg-black aspect-video">
            {activeChapter.videoUrl ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${activeChapter.videoUrl}?rel=0`}
                title={activeChapter.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">No video available</div>
            )}
          </section>

          <h2 className="text-2xl font-bold text-zinc-100">{activeChapter.title}</h2>

          {/* AI Summary */}
          <section className="relative rounded-2xl border-2 border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-zinc-900/60 p-6">
            <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-violet-500 text-xs font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Generated by AutoTune-AI
            </div>
            <div className="prose prose-invert prose-sm max-w-none mt-2">
              <ReactMarkdown>{activeChapter.content}</ReactMarkdown>
            </div>
          </section>

          {/* Practice Lab */}
          <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-zinc-100">Practice Lab</h3>
              </div>
              <button
                onClick={handleMarkExercise}
                disabled={activeChapter.progress?.exerciseCompleted}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-sm font-medium hover:bg-cyan-500/30 disabled:opacity-50"
              >
                {activeChapter.progress?.exerciseCompleted ? 'Exercise Complete ✓' : 'Mark Exercise Done'}
              </button>
            </div>
            <div className="h-48 rounded-xl overflow-hidden border border-zinc-700/60">
              <Editor
                height="100%"
                defaultLanguage="sql"
                theme="vs-dark"
                value={practiceSql}
                onChange={(v) => setPracticeSql(v || '')}
                options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on' }}
              />
            </div>
          </section>

          {/* Quiz */}
          {questions.length > 0 && !activeChapter.progress?.isCompleted && (
            <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6">
              <div className="flex items-center gap-2 mb-6">
                <ClipboardCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-zinc-100">Chapter Quiz ({questions.length} questions)</h3>
                <span className="text-xs text-zinc-500 ml-auto">Pass threshold: 80%</span>
              </div>
              <div className="space-y-6 max-h-[480px] overflow-y-auto pr-2">
                {questions.map((q, qi) => (
                  <div key={q.id} className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/40">
                    <p className="text-sm font-medium text-zinc-200 mb-3">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <label
                          key={oi}
                          className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                            quizAnswers[qi] === oi
                              ? 'bg-violet-500/20 border border-violet-500/40'
                              : 'hover:bg-zinc-700/30 border border-transparent'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${qi}`}
                            checked={quizAnswers[qi] === oi}
                            onChange={() => setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))}
                            className="accent-violet-500"
                          />
                          <span className="text-sm text-zinc-300">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSubmitQuiz}
                disabled={submittingQuiz}
                className="mt-6 w-full py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 disabled:opacity-50"
              >
                {submittingQuiz ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </section>
          )}

          {activeChapter.progress?.isCompleted && (
            <div className="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 text-center">
              <Check className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-200 font-semibold">
                Chapter completed · Quiz score: {activeChapter.progress.quizScore}%
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
