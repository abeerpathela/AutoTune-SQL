import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Check, Play, ChevronRight, Clock, Award, Download, X } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';
import type { Certificate } from '../types';

const DEFAULT_CHAPTERS = [
  {
    id: 'ch-1',
    title: 'SQL Basics',
    order: 1,
    content: `# SQL Basics\n\nLearn foundational SELECT, WHERE, and ORDER BY patterns.\n\n\`\`\`sql\nSELECT name, email FROM users WHERE active = true ORDER BY created_at DESC;\n\`\`\``,
  },
  {
    id: 'ch-2',
    title: 'Joins',
    order: 2,
    content: `# Joins\n\nUnderstand INNER, LEFT, and RIGHT joins for relational queries.\n\n\`\`\`sql\nSELECT u.name, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id;\n\`\`\``,
  },
  {
    id: 'ch-3',
    title: 'Aggregations',
    order: 3,
    content: `# Aggregations\n\nUse GROUP BY, HAVING, and aggregate functions effectively.\n\n\`\`\`sql\nSELECT category, COUNT(*) AS total FROM products GROUP BY category HAVING COUNT(*) > 5;\n\`\`\``,
  },
  {
    id: 'ch-4',
    title: 'Subqueries',
    order: 4,
    content: `# Subqueries\n\nNest queries for filtering and derived tables.\n\n\`\`\`sql\nSELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE country = 'US');\n\`\`\``,
  },
  {
    id: 'ch-5',
    title: 'Optimization',
    order: 5,
    content: `# Optimization\n\nRead EXPLAIN plans and reduce full table scans.\n\n\`\`\`sql\nEXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';\n\`\`\``,
  },
  {
    id: 'ch-6',
    title: 'Transactions',
    order: 6,
    content: `# Transactions\n\nEnsure atomicity with BEGIN, COMMIT, and ROLLBACK.\n\n\`\`\`sql\nBEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;\n\`\`\``,
  },
  {
    id: 'ch-7',
    title: 'Indexes',
    order: 7,
    content: `# Indexes\n\nCreate indexes to accelerate lookups and joins.\n\n\`\`\`sql\nCREATE INDEX idx_orders_status ON orders(status);\n\`\`\``,
  },
  {
    id: 'ch-8',
    title: 'Advanced',
    order: 8,
    content: `# Advanced SQL\n\nWindow functions, CTEs, and performance-aware patterns.\n\n\`\`\`sql\nWITH ranked AS (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn\n  FROM orders\n)\nSELECT * FROM ranked WHERE rn = 1;\n\`\`\``,
  },
];

const DEFAULT_COURSE = {
  id: '1',
  title: 'SQL Mastery Track',
  description: 'Complete path from basics to advanced optimization',
  chapters: DEFAULT_CHAPTERS,
};

export const Academy = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [localCompleted, setLocalCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [generatedCert, setGeneratedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, progressData] = await Promise.all([
          api.getCourses(),
          api.getProgressDetails().catch(() => []),
        ]);

        if (coursesData.length > 0 && coursesData[0].chapters?.length >= 8) {
          setCourses(coursesData);
          setSelectedChapter(coursesData[0].chapters[0]);
        } else {
          setCourses([DEFAULT_COURSE]);
          setSelectedChapter(DEFAULT_CHAPTERS[0]);
        }
        setUserProgress(progressData);
      } catch (err) {
        console.error('Failed to fetch academy data:', err);
        setCourses([DEFAULT_COURSE]);
        setSelectedChapter(DEFAULT_CHAPTERS[0]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const allChapters = courses.flatMap((c) => c.chapters || []);
  const totalChapters = allChapters.length;

  const isChapterCompleted = (chapterId: string) => {
    return (
      localCompleted.includes(chapterId) ||
      userProgress.some((p) => p.chapterId === chapterId && p.status === 'COMPLETED')
    );
  };

  const completedChapters = allChapters.filter((ch) => isChapterCompleted(ch.id));

  const checkCompletion = () => completedChapters.length === totalChapters && totalChapters > 0;

  const markChapterComplete = async () => {
    if (!selectedChapter) return;
    try {
      await api.updateProgress(selectedChapter.id, 'COMPLETED');
      const newProgress = await api.getProgressDetails();
      setUserProgress(newProgress);
    } catch {
      setLocalCompleted((prev) =>
        prev.includes(selectedChapter.id) ? prev : [...prev, selectedChapter.id]
      );
    }
  };

  const handleGenerateCertificate = async () => {
    if (!checkCompletion()) {
      toast.error('Complete all chapters before generating a certificate');
      return;
    }

    setGenerating(true);
    try {
      const cert = await api.generateCertificate('SQL Optimization Fundamentals');
      setGeneratedCert(cert);
      setShowCertModal(true);
      toast.success('Certificate generated successfully!');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err as Error)?.message ||
        'Failed to generate certificate';
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-shimmer h-12 w-64 bg-zinc-800/40 rounded-xl" />
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="animate-shimmer h-96 bg-zinc-800/40 rounded-2xl" />
          <div className="lg:col-span-3 animate-shimmer h-96 bg-zinc-800/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-zinc-100 mb-2"
        >
          SQL Academy
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-zinc-400"
        >
          Master SQL optimization — {completedChapters.length}/{totalChapters} chapters complete
        </motion.p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 flex flex-col"
        >
          <div className="space-y-6 flex-1">
            {courses.map((course) => (
              <div key={course.id} className="space-y-2">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                  {course.title}
                </h3>
                <div className="space-y-1">
                  {course.chapters.map((chapter: any) => {
                    const isCompleted = isChapterCompleted(chapter.id);
                    const isActive = selectedChapter?.id === chapter.id;

                    return (
                      <button
                        key={chapter.id}
                        onClick={() => setSelectedChapter(chapter)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                          isActive
                            ? 'bg-violet-500/20 border border-violet-500/40 text-violet-200'
                            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                        ) : (
                          <Play className="w-5 h-5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isActive ? 'text-violet-200' : ''}`}>
                            {chapter.title}
                          </p>
                          <p className="text-xs text-zinc-500">Chapter {chapter.order}</p>
                        </div>
                        {isActive && <ChevronRight className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {checkCompletion() && (
            <button
              onClick={handleGenerateCertificate}
              disabled={generating}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-900 font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {generating ? (
                <div className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
              ) : (
                <Award className="w-5 h-5" />
              )}
              {generating ? 'Generating...' : 'Generate Certificate'}
            </button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3"
        >
          {selectedChapter ? (
            <div className="spotlight-card rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-sm text-zinc-500">Chapter {selectedChapter.order}</span>
                  <h2 className="text-3xl font-bold text-zinc-100 mt-1">{selectedChapter.title}</h2>
                </div>
                {!isChapterCompleted(selectedChapter.id) && (
                  <button
                    onClick={markChapterComplete}
                    className="px-5 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Mark as Complete
                  </button>
                )}
              </div>

              <div className="prose prose-invert prose-zinc max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ ...props }) => <h1 className="text-2xl font-bold text-zinc-100 mb-4" {...props} />,
                    h2: ({ ...props }) => <h2 className="text-xl font-semibold text-zinc-100 mt-8 mb-3" {...props} />,
                    p: ({ ...props }) => <p className="text-zinc-400 mb-4 leading-relaxed" {...props} />,
                    code: ({ className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <pre className="bg-zinc-800/70 border border-zinc-700/60 rounded-xl p-4 overflow-x-auto my-4">
                          <code className={`font-mono text-sm text-zinc-200 ${className}`} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-zinc-800/70 text-amber-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {selectedChapter.content}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="spotlight-card rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-12 text-center">
              <Clock className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-100 mb-2">Select a Chapter</h3>
              <p className="text-zinc-400">Choose a chapter from the sidebar to start learning</p>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showCertModal && generatedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-zinc-700/60 bg-zinc-900 p-8 text-center relative"
            >
              <button
                onClick={() => setShowCertModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
              <Award className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-zinc-100 mb-2">Certificate Earned!</h3>
              <p className="text-zinc-400 mb-6">
                You completed all {totalChapters} chapters. Your certificate is ready.
              </p>
              <p className="text-xs text-zinc-500 font-mono mb-6 break-all">{generatedCert.certificateId}</p>
              <button
                onClick={() => api.downloadCertificate(generatedCert.id)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
