import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, ShieldAlert } from 'lucide-react';
import { useQuizFocus } from '../../hooks/useQuizFocus';
import type { QuizQuestion, QuizSubmitResult } from '../../types';

type ChapterQuizProps = {
  chapterId: string;
  chapterOrder: number;
  questions: QuizQuestion[];
  disabled?: boolean;
  onSubmit: (answers: number[]) => Promise<QuizSubmitResult>;
  onComplete: (result: QuizSubmitResult) => void;
  onActiveChange?: (active: boolean) => void;
};

export function ChapterQuiz({
  chapterId,
  chapterOrder,
  questions,
  disabled,
  onSubmit,
  onComplete,
  onActiveChange,
}: ChapterQuizProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);

  const { modalMessage, dismissModal, quizLockdown, failed } = useQuizFocus({
    active: started && !disabled && !submitting,
    chapterId,
    chapterOrder,
  });

  const handleSubmit = async () => {
    const payload = questions.map((_, i) => answers[i] ?? -1);
    if (payload.some((a) => a < 0)) return;

    setSubmitting(true);
    try {
      const res = await onSubmit(payload);
      onComplete(res);
    } finally {
      setSubmitting(false);
    }
  };

  if (!started) {
    return (
      <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-zinc-100 mb-2">Chapter Quiz — Focus Mode</h3>
        <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
          Ten questions · 80% required to pass. Stay on this page — tab switches trigger warnings;
          a third violation fails the quiz automatically.
        </p>
        <button
          onClick={() => {
            setStarted(true);
            onActiveChange?.(true);
          }}
          disabled={disabled}
          className="px-8 py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 disabled:opacity-50"
        >
          Start Quiz
        </button>
      </section>
    );
  }

  if (failed) return null;

  return (
    <>
      <AnimatePresence>
        {modalMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="max-w-md w-full rounded-2xl border border-amber-500/40 bg-zinc-900 p-8 text-center"
            >
              <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-amber-200 mb-4">{modalMessage}</p>
              <button
                onClick={dismissModal}
                className="px-6 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-medium"
              >
                I understand — continue quiz
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section
        className={`rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 ${
          quizLockdown ? 'ring-2 ring-amber-500/30' : ''
        }`}
      >
        <div className="flex items-center gap-2 mb-6">
          <ClipboardCheck className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-zinc-100">
            Chapter Quiz ({questions.length} questions)
          </h3>
          {quizLockdown && (
            <span className="text-xs text-amber-400 ml-auto flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Focus Mode
            </span>
          )}
          <span className="text-xs text-zinc-500">Pass: 80%</span>
        </div>

        <div className="space-y-5 max-h-[520px] overflow-y-auto pr-2">
          {questions.map((q, qi) => (
            <div key={q.id} className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/50">
              <p className="text-sm font-medium text-zinc-200 mb-3">
                {qi + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                      answers[qi] === oi
                        ? 'bg-violet-500/20 border border-violet-500/40'
                        : 'hover:bg-zinc-700/30 border border-transparent'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${qi}`}
                      disabled={disabled || submitting}
                      checked={answers[qi] === oi}
                      onChange={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
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
          onClick={handleSubmit}
          disabled={disabled || submitting || questions.some((_, i) => answers[i] === undefined)}
          className="mt-6 w-full py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </section>
    </>
  );
}
