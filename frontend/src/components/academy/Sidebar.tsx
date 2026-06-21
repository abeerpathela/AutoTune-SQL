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
        className={`lg:col-span-1 flex flex-col max-h-[80vh] ${
          quizActive ? 'pointer-events-none opacity-40 select-none' : ''
        }`}
      >
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {moduleTitles.map((moduleTitle) => (
            <div key={moduleTitle}>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">
                {moduleTitle}
              </h3>
              <div className="space-y-1">
                {catalog
                  .filter((c) => c.moduleTitle === moduleTitle)
                  .map((ch) => {
                    const isFinished = completedChapters.includes(ch.id);
                    const unlocked = isUnlockedByProgress(catalog, ch, completedChapters);
                    const isActive = ch.globalOrder === activeGlobalOrder;

                    return (
                      <motion.button
                        key={ch.id}
                        layout
                        initial={false}
                        whileHover={unlocked && !quizActive ? { x: 2 } : undefined}
                        onClick={() => {
                          if (!quizActive && unlocked) {
                            navigate(`/learn/chapter/${ch.globalOrder}`);
                            onNavigate?.();
                          }
                        }}
                        disabled={!unlocked || quizActive}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-all ${
                          isActive
                            ? 'bg-violet-500/20 border border-violet-500/40 text-violet-200'
                            : unlocked
                            ? 'text-zinc-400 hover:bg-zinc-800/60'
                            : 'text-zinc-600 opacity-50 cursor-not-allowed'
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
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
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
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800/80 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCertificate}
            disabled={generating || quizActive}
            className={`relative w-full overflow-hidden rounded-lg px-4 py-3 font-bold text-black shadow-[0_0_15px_rgba(255,255,255,0.2)] disabled:opacity-60 ${
              totalProgress >= 100
                ? 'bg-gradient-to-r from-zinc-200 to-zinc-500'
                : 'bg-gradient-to-r from-zinc-700 to-zinc-800 text-zinc-300 shadow-none'
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
          <p className="text-[10px] text-zinc-600 text-center mt-2">
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
