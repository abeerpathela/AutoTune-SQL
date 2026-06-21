import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import type { QuizQuestion, QuizReviewItem, QuizSubmitResult } from '../types';

type LocationState = {
  result: QuizSubmitResult;
  chapterId: string;
  chapterOrder: number;
  chapterTitle?: string;
  questions?: QuizQuestion[];
  focusFailed?: boolean;
};

export function QuizResult() {
  const { order } = useParams<{ order: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const { applyMasterState } = useProgress();

  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (state?.result?.passed && state.result.completedCount !== undefined) {
      applyMasterState(state.result);
    }
  }, [state, applyMasterState]);

  if (!state?.result) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-muted">No quiz result found.</p>
        <button
          onClick={() => navigate(`/learn/chapter/${order ?? 1}`)}
          className="btn-primary rounded-xl px-6 py-3 font-semibold"
        >
          Back to Chapter
        </button>
      </div>
    );
  }

  const { result, chapterOrder, chapterTitle, focusFailed } = state;
  const passed = result.passed;
  const correct = result.correctCount ?? Math.round((result.score / 100) * (result.totalCount || 10));
  const total = result.totalCount ?? 10;
  const review: QuizReviewItem[] = result.review ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-10 text-center ${
          passed ? 'bg-success-subtle border-[var(--success-border)]' : 'bg-error-subtle border-[var(--error-border)]'
        }`}
      >
        {focusFailed ? (
          <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-amber-500" />
        ) : passed ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-success" />
          </motion.div>
        ) : (
          <XCircle className="mx-auto mb-4 h-16 w-16 text-error" />
        )}

        <h1 className="mb-2 text-3xl font-bold text-primary">
          {focusFailed ? 'Quiz Failed — Focus Violation' : passed ? 'Quiz Passed!' : 'Quiz Failed'}
        </h1>

        {chapterTitle && <p className="mb-6 text-muted">{chapterTitle}</p>}

        <div className="mb-6 flex justify-center gap-8">
          <div>
            <p className="text-4xl font-bold text-primary">
              {correct}/{total}
            </p>
            <p className="text-sm text-subtle">Score</p>
          </div>
          <div>
            <p className="text-4xl font-bold accent-shimmer">{result.score}%</p>
            <p className="text-sm text-subtle">Percentage</p>
          </div>
          <div>
            <p
              className={`rounded-lg px-4 py-2 text-2xl font-bold ${
                passed ? 'bg-success-subtle text-success' : 'bg-error-subtle text-error'
              }`}
            >
              {passed ? 'PASS' : 'FAIL'}
            </p>
            <p className="mt-1 text-sm text-subtle">Status</p>
          </div>
        </div>

        {passed && !focusFailed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-medium text-success"
          >
            Success! Next chapter unlocked.
          </motion.p>
        )}

        {focusFailed && (
          <p className="text-sm text-amber-600 dark:text-amber-300">
            You left the quiz page three times. Score set to 0%. Review the theory and retry.
          </p>
        )}

        {!passed && !focusFailed && (
          <p className="text-sm text-muted">You need 80% (8/10) to pass. Review your answers below.</p>
        )}
      </motion.div>

      <div className="flex flex-wrap justify-center gap-3">
        {review.length > 0 && (
          <button
            onClick={() => setShowReview((v) => !v)}
            className="interactive-target inline-flex items-center gap-2 rounded-xl border border-theme bg-[var(--bg-elevated)] px-5 py-3 font-medium text-primary hover:bg-[var(--accent-glow)]"
          >
            <ClipboardList className="h-4 w-4" />
            {showReview ? 'Hide Review' : 'Review Answers'}
          </button>
        )}
        <button
          onClick={() => navigate(`/learn/chapter/${chapterOrder}`)}
          className="interactive-target inline-flex items-center gap-2 rounded-xl border border-theme bg-[var(--bg-elevated)] px-5 py-3 font-semibold text-primary hover:bg-[var(--accent-glow)]"
        >
          <RotateCcw className="h-4 w-4" />
          Retry Quiz
        </button>
        {passed && result.nextChapterId && (
          <button
            onClick={() => navigate(`/learn/chapter/${chapterOrder + 1}`)}
            className="btn-gradient inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold"
          >
            Next Chapter
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showReview && review.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {review.map((item, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 ${
                  item.isCorrect ? 'bg-success-subtle border-[var(--success-border)]' : 'bg-error-subtle border-[var(--error-border)]'
                }`}
              >
                <p className="mb-3 text-sm font-medium text-primary">
                  {i + 1}. {item.question}
                </p>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-subtle">Your answer</p>
                    <p className={`font-medium ${item.isCorrect ? 'text-success' : 'text-error'}`}>
                      {item.userAnswer >= 0 ? item.options[item.userAnswer] : '—'}
                    </p>
                  </div>
                  {!item.isCorrect && (
                    <div>
                      <p className="mb-1 text-subtle">Correct answer</p>
                      <p className="font-medium text-success">{item.options[item.correctAnswer]}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
