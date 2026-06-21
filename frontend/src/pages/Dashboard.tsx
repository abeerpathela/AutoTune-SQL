import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Database, Clock, Brain, ArrowRight, Award, GraduationCap } from 'lucide-react';
import { api } from '../lib/api';
import { CircularProgress } from '../components/ui/CircularProgress';
import { MagneticButton } from '../components/ui/InteractionLayer';
import { BrandStrip } from '../components/brand/BrandStrip';
import { useProgress } from '../contexts/ProgressContext';

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [datasetStats, setDatasetStats] = useState<any>(null);
  const { stats: academyProgress } = useProgress();
  const [certificates, setCertificates] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, certs] = await Promise.all([
          api.getDatasetStats(),
          api.getMyCertificates().catch(() => []),
        ]);
        setDatasetStats(stats);
        setCertificates(certs);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const progress = {
    percentage: academyProgress.progressPercent,
    completed: academyProgress.completedCount,
    total: academyProgress.totalChapters,
  };

  const recentQueries = [
    { id: '1', query: 'SELECT * FROM orders o JOIN users u ON o.user_id = u.id', time: '2.3s', status: 'Optimized' },
    { id: '2', query: 'SELECT * FROM products WHERE category_id = 5', time: '0.8s', status: 'Good' },
    { id: '3', query: 'SELECT COUNT(*) FROM audit_log WHERE created_at > NOW() - INTERVAL \'7 days\'', time: '1.5s', status: 'Needs Review' },
  ];

  const StatCard = ({ icon: Icon, title, value, description, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="spotlight-card rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700/60 bg-zinc-800/60`}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-zinc-100 mb-1">{value}</h3>
      <p className="text-sm text-zinc-400">{title}</p>
      {description && <p className="text-xs text-zinc-500 mt-2">{description}</p>}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-shimmer h-12 w-64 bg-zinc-800/40 rounded-xl" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-shimmer h-48 bg-zinc-800/40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BrandStrip title="Command Center" subtitle="Your SQL optimization hub" />
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-zinc-100 mb-2"
        >
          Welcome back
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-zinc-400"
        >
          Here's what's happening with your SQL optimization today
        </motion.p>
      </div>

      {/* Academy Progress Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="spotlight-card rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 to-zinc-900/40 p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-sm text-violet-400 font-medium mb-1">Academy Progress</p>
            <h2 className="text-3xl font-bold text-zinc-100 mb-2">
              {progress.completed} / {progress.total || 36} Chapters
            </h2>
            <p className="text-zinc-400">
              {progress.percentage >= 100
                ? 'All chapters complete — unlock your certification!'
                : 'Complete all chapters with ≥80% quiz scores to earn your certificate.'}
            </p>
          </div>
          <div className="flex-1 max-w-xl">
            <div className="flex justify-between text-sm text-zinc-400 mb-2">
              <span>Current Progress</span>
              <span className="text-violet-300 font-semibold">{progress.percentage}%</span>
            </div>
            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <MagneticButton
              variant="secondary"
              onClick={() => { window.location.href = '/learn/chapter/1'; }}
              className="w-full mt-4"
            >
              Continue Learning
            </MagneticButton>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Database}
          title="Queries Optimized"
          value={datasetStats?.totalQueries || 0}
          description="Total queries processed"
          color="#6366F1"
        />
        <StatCard
          icon={Clock}
          title="Avg Execution Time"
          value={`${datasetStats?.avgExecutionTime?.toFixed(2) || 0}s`}
          description="Average query latency"
          color="#34D399"
        />
        <StatCard
          icon={Zap}
          title="Slow Queries"
          value={Math.round((datasetStats?.totalQueriesByCategory?.PERFORMANCE || 0) * 0.75)}
          description="Queries that need attention"
          color="#FBBF24"
        />
        <StatCard
          icon={Brain}
          title="ML Accuracy"
          value="87%"
          description="Model prediction accuracy"
          color="#8B5CF6"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Learning Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 spotlight-card rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="w-5 h-5 text-zinc-400" />
            <h2 className="text-xl font-semibold text-zinc-100">Learning Progress</h2>
          </div>
          <div className="flex justify-center mb-6">
            <CircularProgress percentage={progress.percentage || 0} color="#8B5CF6" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Completed Chapters</span>
              <span className="text-zinc-100 font-medium">{progress.completed} / {progress.total}</span>
            </div>
            <MagneticButton variant="secondary" onClick={() => { window.location.href = '/learn/chapter/1'; }} className="w-full">
              Continue Learning
            </MagneticButton>
          </div>
        </motion.div>

        {/* Recent Queries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 spotlight-card rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-zinc-400" />
              <h2 className="text-xl font-semibold text-zinc-100">Recent Queries</h2>
            </div>
            <Link
              to="/studio"
              className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Analyze New Query
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentQueries.map((query, index) => (
              <motion.div
                key={query.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-start justify-between p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/40"
              >
                <div className="flex-1 mr-4">
                  <p className="text-sm font-mono text-zinc-100 mb-1 truncate">{query.query}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-zinc-500">{query.time}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      query.status === 'Optimized'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : query.status === 'Good'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {query.status}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-600 flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Certificates Section */}
      {certificates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="spotlight-card rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-zinc-400" />
            <h2 className="text-xl font-semibold text-zinc-100">Your Certificates</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert, index) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/40"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                    <Award className="w-5 h-5 text-yellow-900" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-100">{cert.type}</h3>
                    <p className="text-xs text-zinc-500">Issued {new Date(cert.issueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(cert.verificationLink, '_blank')}
                    className="flex-1 text-sm px-3 py-2 rounded-lg bg-zinc-700/40 text-zinc-100 hover:bg-zinc-700/60 transition-colors"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => api.downloadCertificate(cert.id)}
                    className="flex-1 text-sm px-3 py-2 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors"
                  >
                    Download
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
