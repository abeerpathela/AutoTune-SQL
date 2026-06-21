import { motion } from 'framer-motion';

function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-zinc-800/80 rounded-lg ${className ?? ''}`}
    />
  );
}

export function ChapterHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="space-y-3 flex-1">
        <Pulse className="h-4 w-32" />
        <Pulse className="h-9 w-64" />
        <Pulse className="h-4 w-48" />
      </div>
      <div className="w-full sm:w-72 space-y-2">
        <Pulse className="h-2.5 w-full rounded-full" />
        <Pulse className="h-3 w-24 ml-auto" />
      </div>
    </div>
  );
}

export function VideoPlayerSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full aspect-video rounded-xl border border-zinc-800 overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-zinc-900" />
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/40 to-zinc-900/80" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-zinc-700/60 animate-pulse" />
      </div>
      <div className="absolute bottom-0 inset-x-0 h-12 bg-zinc-800/60 animate-pulse" />
    </motion.div>
  );
}

export function TheoryBlockSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-8 space-y-4">
      <Pulse className="h-6 w-40" />
      <div className="space-y-3">
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-5/6" />
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-4/6" />
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function QuizSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-8 space-y-6">
      <Pulse className="h-6 w-48" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Pulse className="h-4 w-full" />
          <Pulse className="h-10 w-full rounded-xl" />
          <Pulse className="h-10 w-full rounded-xl" />
          <Pulse className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <Pulse className="h-12 w-full rounded-xl" />
    </div>
  );
}

export function ChapterContentSkeleton({ isVideo }: { isVideo?: boolean }) {
  return (
    <div className="space-y-6">
      <Pulse className="h-8 w-3/4 max-w-md" />
      {isVideo ? (
        <>
          <VideoPlayerSkeleton />
          <TheoryBlockSkeleton />
          <Pulse className="h-14 w-full rounded-lg" />
        </>
      ) : (
        <>
          <TheoryBlockSkeleton />
          <QuizSkeleton />
        </>
      )}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <aside className="lg:col-span-1 space-y-4">
      {[1, 2, 3].map((mod) => (
        <div key={mod} className="space-y-2">
          <Pulse className="h-3 w-24 mx-2" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Pulse key={i} className="h-9 w-full rounded-xl" />
          ))}
        </div>
      ))}
      <Pulse className="h-12 w-full rounded-lg mt-4" />
    </aside>
  );
}
