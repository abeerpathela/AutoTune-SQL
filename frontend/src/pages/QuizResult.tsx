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
      <div className="text-center py-20">
        <p className="text-zinc-400 mb-4">No quiz result found.</p>
        <button
          onClick={() => navigate(`/learn/chapter/${order ?? 1}`)}
          className="px-6 py-3 rounded-xl bg-violet-500 text-white font-semibold"
        >
          Back to Chapter
        </button>
      </div>
    );
  }

  const { result, chapterOrder, chapterTitle, questions, focusFailed } = state;
  const passed = result.passed;
  const correct = result.correctCount ?? Math.round((result.score / 100) * (result.totalCount || 10));
  const total = result.totalCount ?? 10;
  const review: QuizReviewItem[] = result.review ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-10 text-center ${
          passed
            ? 'border-emerald-500/50 bg-emerald-950/30'
            : 'border-red-500/40 bg-red-950/20'
        }`}
      >
        {focusFailed ? (
          <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        ) : passed ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          </motion.div>
        ) : (
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        )}

        <h1 className="text-3xl font-bold text-zinc-100 mb-2">
          {focusFailed ? 'Quiz Failed — Focus Violation' : passed ? 'Quiz Passed!' : 'Quiz Failed'}
        </h1>

        {chapterTitle && <p className="text-zinc-400 mb-6">{chapterTitle}</p>}

        <div className="flex justify-center gap-8 mb-6">
          <div>
            <p className="text-4xl font-bold text-zinc-100">
              {correct}/{total}
            </p>
            <p className="text-sm text-zinc-500">Score</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-violet-400">{result.score}%</p>
            <p className="text-sm text-zinc-500">Percentage</p>
          </div>
          <div>
            <p
              className={`text-2xl font-bold px-4 py-2 rounded-lg ${
                passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
              }`}
            >
              {passed ? 'PASS' : 'FAIL'}
            </p>
            <p className="text-sm text-zinc-500 mt-1">Status</p>
          </div>
        </div>

        {passed && !focusFailed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-emerald-300 font-medium"
          >
            Success! Next chapter unlocked.
          </motion.p>
        )}

        {focusFailed && (
          <p className="text-amber-300/90 text-sm">
            You left the quiz page three times. Score set to 0%. Review the theory and retry.
          </p>
        )}

        {!passed && !focusFailed && (
          <p className="text-zinc-400 text-sm">You need 80% (8/10) to pass. Review your answers below.</p>
        )}
      </motion.div>

      <div className="flex flex-wrap gap-3 justify-center">
        {review.length > 0 && (
          <button
            onClick={() => setShowReview((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 text-zinc-100 hover:bg-zinc-700 font-medium"
          >
            <ClipboardList className="w-4 h-4" />
            {showReview ? 'Hide Review' : 'Review Answers'}
          </button>
        )}
        <button
          onClick={() => navigate(`/learn/chapter/${chapterOrder}`)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600"
        >
          <RotateCcw className="w-4 h-4" />
          Retry Quiz
        </button>
        {passed && result.nextChapterId && (
          <button
            onClick={() => navigate(`/learn/chapter/${chapterOrder + 1}`)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500"
          >
            Next Chapter
            <ChevronRight className="w-4 h-4" />
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
                className={`p-4 rounded-xl border ${
                  item.isCorrect
                    ? 'border-emerald-500/30 bg-emerald-950/20'
                    : 'border-red-500/30 bg-red-950/15'
                }`}
              >
                <p className="text-sm font-medium text-zinc-200 mb-3">
                  {i + 1}. {item.question}
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-zinc-500 mb-1">Your answer</p>
                    <p className={item.isCorrect ? 'text-emerald-300' : 'text-red-300'}>
                      {item.userAnswer >= 0 ? item.options[item.userAnswer] : '—'}
                    </p>
                  </div>
                  {!item.isCorrect && (
                    <div>
                      <p className="text-zinc-500 mb-1">Correct answer</p>
                      <p className="text-emerald-300">{item.options[item.correctAnswer]}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {questions && showReview && review.length === 0 && (
        <p className="text-center text-zinc-500 text-sm">No detailed review available for this attempt.</p>
      )}
    </div>
  );
}
