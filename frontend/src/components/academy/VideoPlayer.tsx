import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { extractYouTubeId, getThumbnailUrl, getWatchUrl, isValidYouTubeId } from '../../utils/youtube';

export type VideoWatchStats = {
  maxWatchPercent: number;
  maxTimeWatched: number;
  duration: number;
  completionReady: boolean;
  canMarkComplete: boolean;
};

type VideoPlayerProps = {
  videoId: string | null | undefined;
  initialWatchPercent?: number;
  onLoaded?: () => void;
  onWatchUpdate?: (stats: VideoWatchStats) => void;
};

const COMPLETION_THRESHOLD = 0.95;
const MARK_COMPLETE_THRESHOLD = 0.8;
const SEEK_TOLERANCE_SEC = 3;

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YtPlayer }) => void;
            onStateChange?: (event: { data: number; target: YtPlayer }) => void;
          };
        }
      ) => YtPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YtPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });

  return ytApiPromise;
}

export function VideoPlayer({
  videoId,
  initialWatchPercent = 0,
  onLoaded,
  onWatchUpdate,
}: VideoPlayerProps) {
  const id = extractYouTubeId(videoId);
  const thumbnailUrl = id ? getThumbnailUrl(id) : null;
  const watchUrl = id ? getWatchUrl(id) : null;
  const containerId = `yt-player-${id ?? 'none'}`;

  const [activated, setActivated] = useState(false);
  const [ready, setReady] = useState(false);
  const [showCompletionNotice, setShowCompletionNotice] = useState(initialWatchPercent >= 95);

  const playerRef = useRef<YtPlayer | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimeWatchedRef = useRef(0);
  const lastTimeRef = useRef(0);
  const maxPercentRef = useRef(Math.min(100, initialWatchPercent));
  const completionReadyRef = useRef(initialWatchPercent >= 95);
  const durationRef = useRef(0);

  const emitStats = useCallback(() => {
    onWatchUpdate?.({
      maxWatchPercent: maxPercentRef.current,
      maxTimeWatched: maxTimeWatchedRef.current,
      duration: durationRef.current,
      completionReady: completionReadyRef.current,
      canMarkComplete: maxPercentRef.current >= MARK_COMPLETE_THRESHOLD * 100,
    });
  }, [onWatchUpdate]);

  const processTime = useCallback(
    (playedSeconds: number) => {
      const d = durationRef.current;
      if (d <= 0) return;

      const delta = playedSeconds - lastTimeRef.current;
      const isNaturalProgress = delta >= 0 && delta <= SEEK_TOLERANCE_SEC;
      const isRewind = playedSeconds < lastTimeRef.current;

      if (isNaturalProgress || isRewind) {
        if (playedSeconds <= maxTimeWatchedRef.current + SEEK_TOLERANCE_SEC) {
          maxTimeWatchedRef.current = Math.max(maxTimeWatchedRef.current, playedSeconds);
        }
      }

      lastTimeRef.current = playedSeconds;

      const percent = Math.min(100, Math.round((maxTimeWatchedRef.current / d) * 100));
      if (percent > maxPercentRef.current) maxPercentRef.current = percent;

      const positionPercent = playedSeconds / d;
      if (
        positionPercent >= COMPLETION_THRESHOLD &&
        maxPercentRef.current >= MARK_COMPLETE_THRESHOLD * 100 &&
        !completionReadyRef.current
      ) {
        completionReadyRef.current = true;
        setShowCompletionNotice(true);
      }

      emitStats();
    },
    [emitStats]
  );

  useEffect(() => {
    setActivated(false);
    setReady(false);
    durationRef.current = 0;
    maxTimeWatchedRef.current = 0;
    lastTimeRef.current = 0;
    maxPercentRef.current = Math.min(100, initialWatchPercent);
    completionReadyRef.current = initialWatchPercent >= 95;
    setShowCompletionNotice(initialWatchPercent >= 95);

    if (pollRef.current) clearInterval(pollRef.current);
    playerRef.current?.destroy?.();
    playerRef.current = null;
  }, [id, initialWatchPercent]);

  useEffect(() => {
    if (!activated || !id || !isValidYouTubeId(id)) return;

    let cancelled = false;

    const initPlayer = async () => {
      await loadYouTubeApi();
      if (cancelled || !window.YT?.Player) return;

      playerRef.current?.destroy?.();

      playerRef.current = new window.YT.Player(containerId, {
        videoId: id,
        playerVars: {
          rel: 0,
          origin: window.location.origin,
          enablejsapi: 1,
          modestbranding: 1,
        },
        events: {
          onReady: (event) => {
            const d = event.target.getDuration();
            if (!Number.isFinite(d) || d <= 0) return;

            durationRef.current = d;
            setReady(true);

            if (initialWatchPercent > 0) {
              maxTimeWatchedRef.current = d * (initialWatchPercent / 100);
              maxPercentRef.current = initialWatchPercent;
              if (initialWatchPercent >= 95) completionReadyRef.current = true;
            }

            onLoaded?.();
            emitStats();

            pollRef.current = setInterval(() => {
              try {
                const t = event.target.getCurrentTime();
                processTime(t);
              } catch {
                /* player torn down */
              }
            }, 500);
          },
          onStateChange: (event) => {
            if (event.data === window.YT!.PlayerState.ENDED) {
              if (durationRef.current > 0) {
                maxTimeWatchedRef.current = durationRef.current;
                maxPercentRef.current = 100;
              }
              completionReadyRef.current = true;
              setShowCompletionNotice(true);
              emitStats();
            }
          },
        },
      });
    };

    void initPlayer();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [activated, id, containerId, initialWatchPercent, onLoaded, emitStats, processTime]);

  useEffect(() => {
    if (!activated || !ready) return;
    const iframe = document.querySelector(`#${containerId} iframe`) as HTMLIFrameElement | null;
    if (iframe) iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  }, [activated, ready, containerId]);

  if (!id || !isValidYouTubeId(id)) {
    return (
      <div className="w-full aspect-video rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 px-6 text-center">
        This chapter is a Theory Lesson. Please read the content below.
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800">
        {!activated ? (
          <button
            type="button"
            onClick={() => setActivated(true)}
            className="group absolute inset-0 w-full h-full cursor-pointer"
            aria-label="Play lecture video"
          >
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                decoding="async"
              />
            )}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.25)]"
              >
                <Play className="w-7 h-7 text-black ml-1" fill="currentColor" />
              </motion.div>
            </div>
          </button>
        ) : (
          <>
            {!ready && (
              <div className="absolute inset-0 z-10 animate-pulse bg-zinc-800/90 flex items-center justify-center">
                <span className="text-sm text-zinc-500">Loading lecture…</span>
              </div>
            )}
            <div id={containerId} className="w-full h-full" />
          </>
        )}
      </div>

      <AnimatePresence>
        {showCompletionNotice && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm text-emerald-400/90 font-medium"
          >
            Completion Ready — you may mark this video complete.
          </motion.p>
        )}
      </AnimatePresence>

      {watchUrl && (
        <p className="text-center text-xs text-zinc-500">
          Video not loading?{' '}
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
          >
            Watch directly on YouTube
          </a>
        </p>
      )}
    </motion.div>
  );
}
