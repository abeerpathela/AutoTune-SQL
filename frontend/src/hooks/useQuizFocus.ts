import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const WARNINGS = [
  'Warning 1/3: Stay on the quiz page.',
  'Final Warning 2/3: Next switch will fail the quiz.',
] as const;

type UseQuizFocusOptions = {
  active: boolean;
  chapterId: string;
  chapterOrder: number;
};

export function useQuizFocus({ active, chapterId, chapterOrder }: UseQuizFocusOptions) {
  const navigate = useNavigate();
  const [violationCount, setViolationCount] = useState(0);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const handlingRef = useRef(false);
  const activeRef = useRef(active);
  const violationRef = useRef(0);
  const lastViolationAt = useRef(0);

  activeRef.current = active;

  const dismissModal = useCallback(() => setModalMessage(null), []);

  const handleViolation = useCallback(async () => {
    if (!activeRef.current || handlingRef.current || failed) return;

    const now = Date.now();
    if (now - lastViolationAt.current < 800) return;
    lastViolationAt.current = now;

    handlingRef.current = true;

    try {
      const nextCount = violationRef.current + 1;
      violationRef.current = nextCount;
      setViolationCount(nextCount);

      if (nextCount >= 3) {
        setFailed(true);
        const result = await api.failQuiz(chapterId, 'focus_violation');
        navigate(`/learn/chapter/${chapterOrder}/quiz-result`, {
          replace: true,
          state: {
            result,
            chapterId,
            chapterOrder,
            focusFailed: true,
          },
        });
        return;
      }

      await api.recordFocusViolation(chapterId);
      setModalMessage(WARNINGS[nextCount - 1] ?? WARNINGS[0]);
    } finally {
      handlingRef.current = false;
    }
  }, [chapterId, chapterOrder, failed, navigate]);

  // Block browser back while quiz is active
  useEffect(() => {
    if (!active) return;

    const pushLock = () => {
      window.history.pushState({ quizLock: true }, '');
    };

    pushLock();
    const onPopState = () => {
      if (activeRef.current) {
        pushLock();
        void handleViolation();
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [active, handleViolation]);

  useEffect(() => {
    if (!active) return;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void handleViolation();
      }
    };

    const onBlur = () => {
      void handleViolation();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [active, handleViolation]);

  return {
    violationCount,
    modalMessage,
    dismissModal,
    failed,
    quizLockdown: active && !failed,
  };
}
