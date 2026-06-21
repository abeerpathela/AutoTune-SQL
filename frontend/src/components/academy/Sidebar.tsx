import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { Check, Lock, BookOpen, Video, ChevronRight, Award, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { generateCertificatePdf, celebrateCertificateUnlock } from '../../services/certificateService';
import { useAuth } from '../../contexts/AuthContext';
import { useProgress } from '../../contexts/ProgressContext';
import type { Chapter } from '../../types';

type AcademySidebarProps = {
  catalog: Chapter[];
  activeGlobalOrder: number;
  quizActive?: boolean;
  onNavigate?: () => void;
};

function isUnlockedByProgress(
  chapters: Chapter[],
  ch: Chapter,
  completedChapters: string[]
): boolean {
  if (ch.globalOrder === 1) return true;
  const sorted = [...chapters].sort((a, b) => (a.globalOrder ?? 0) - (b.globalOrder ?? 0));
  const idx = sorted.findIndex((c) => c.id === ch.id);
  if (idx <= 0) return true;
  const prev = sorted[idx - 1];
  return completedChapters.includes(prev.id);
}

export const AcademySidebar = memo(function AcademySidebar({
  catalog,
  activeGlobalOrder,
  quizActive = false,
  onNavigate,
}: AcademySidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { completedChapters, stats } = useProgress();
  const totalProgress = stats.progressPercent;
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || 'AutoTune Graduate';

  const handleCertificate = async () => {
    if (totalProgress < 100) {
      setShowLockedModal(true);
      return;
    }

    setGenerating(true);
    try {
      const cert = await api.generateCertificate('SQL Optimization Specialist');
      const certId = cert.certificateId || cert.id;
      const verificationLink =
        cert.verificationLink || `${window.location.origin}/certificate/${certId}`;

      await generateCertificatePdf({
        userName: displayName,
        certificateId: certId,
        verificationLink,
      });

      celebrateCertificateUnlock();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 6000);
      toast.success('Certificate generated!');
      navigate(`/certificate/${certId}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to generate certificate';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const moduleTitles = Array.from(new Set(catalog.map((c) => c.moduleTitle)));

  const listVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.35, ease: 'easeOut' as const },
    },
  };

  return (
    <>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={400}
          colors={['#e4e4e7', '#a1a1aa', '#22c55e', '#8b5cf6', '#fafafa']}
        />
      )}

      <aside
        className={`glass lg:col-span-1 flex max-h-[80vh] flex-col rounded-2xl p-3 ${
          quizActive ? 'pointer-events-none select-none opacity-40' : ''
        }`}
      >
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {moduleTitles.map((moduleTitle) => (
            <div key={moduleTitle}>
              <h3 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
                {moduleTitle}
              </h3>
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="space-y-0.5"
              >
                {catalog
                  .filter((c) => c.moduleTitle === moduleTitle)
                  .map((ch) => {
                    const isFinished = completedChapters.includes(ch.id);
                    const unlocked = isUnlockedByProgress(catalog, ch, completedChapters);
                    const isActive = ch.globalOrder === activeGlobalOrder;

                    return (
                      <motion.button
                        key={ch.id}
                        variants={itemVariants}
                        layout
                        whileHover={unlocked && !quizActive ? { x: 3 } : undefined}
                        onClick={() => {
                          if (!quizActive && unlocked) {
                            navigate(`/learn/chapter/${ch.globalOrder}`);
                            onNavigate?.();
                          }
                        }}
                        disabled={!unlocked || quizActive}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-all ${
                          isActive
                            ? 'border border-theme bg-[var(--text-primary)] font-medium text-[var(--bg-base)]'
                            : unlocked
                              ? 'text-muted hover:bg-[var(--accent-glow)] hover:text-primary'
                              : 'cursor-not-allowed text-subtle opacity-45'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          {isFinished ? (
                            <motion.span
                              key={`check-${ch.id}`}
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >
                              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                            </motion.span>
                          ) : unlocked ? (
                            <motion.span key={`icon-${ch.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              {ch.type === 'VIDEO' ? (
                                <Video className="w-4 h-4 shrink-0" />
                              ) : (
                                <BookOpen className="w-4 h-4 shrink-0" />
                              )}
                            </motion.span>
                          ) : (
                            <motion.span key={`lock-${ch.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <Lock className="w-4 h-4 shrink-0" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <span className="truncate flex-1">
                          {ch.globalOrder}. {ch.title}
                        </span>
                        {isActive && <ChevronRight className="w-3 h-3" />}
                      </motion.button>
                    );
                  })}
              </motion.div>
            </div>
          ))}
        </div>

        <div className="mt-4 shrink-0 border-t border-theme pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCertificate}
            disabled={generating || quizActive}
            className={`interactive-target relative w-full overflow-hidden rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-60 ${
              totalProgress >= 100
                ? 'bg-[var(--text-primary)] text-[var(--bg-base)] shadow-glow'
                : 'border border-theme bg-[var(--bg-elevated)] text-muted'
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {generating ? (
                <span className="animate-pulse">Generating…</span>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  Generate SQL Master Certificate
                </>
              )}
            </span>
            {totalProgress >= 100 && (
              <motion.span
                className="absolute inset-0 bg-white/20"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
              />
            )}
          </motion.button>
          <p className="mt-2 text-center text-[10px] text-subtle">
            {totalProgress}% · {stats.totalChapters} chapters
          </p>
        </div>
      </aside>

      <AnimatePresence>
        {showLockedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowLockedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              className="max-w-md w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowLockedModal(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
              <p className="text-lg font-bold text-zinc-100 text-center mb-2">
                ⚠️ Almost there!
              </p>
              <p className="text-zinc-400 text-center text-sm">
                Complete all {stats.totalChapters} chapters to unlock your AutoTune-SQL certification.
              </p>
              <p className="text-violet-400 text-center font-semibold mt-4">{totalProgress}% complete</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
