import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, ExternalLink, Linkedin, Lock, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { BrandStrip } from '../components/brand/BrandStrip';
import {
  generateCertificatePdf,
  getLinkedInShareUrl,
} from '../services/certificateService';
import type { Certificate } from '../types';

const TOTAL_CHAPTERS = 36;
const CERT_TITLE = 'SQL Optimization Specialist';

function CertificateCard({
  cert,
  displayName,
  index,
}: {
  cert: Certificate;
  displayName: string;
  index: number;
}) {
  const [downloading, setDownloading] = useState(false);
  const verifyUrl =
    cert.verificationLink || `${window.location.origin}/verify/${cert.certificateId}`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await api.downloadCertificate(cert.id);
      toast.success('Certificate PDF downloaded.');
    } catch {
      try {
        await generateCertificatePdf({
          userName: displayName,
          certificateId: cert.certificateId,
          verificationLink: verifyUrl,
          issueDate: cert.issueDate,
        });
        toast.success('Certificate PDF downloaded.');
      } catch {
        toast.error('Failed to download certificate.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleShareLinkedIn = () => {
    window.open(getLinkedInShareUrl(verifyUrl), '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-[0_0_40px_-12px_rgba(139,92,246,0.25)]"
    >
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl transition-opacity group-hover:opacity-100 opacity-60" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 border border-zinc-700/60">
            <Award className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Verified Credential</p>
            <h3 className="text-xl font-semibold text-zinc-50">{CERT_TITLE}</h3>
          </div>
        </div>
        <Sparkles className="h-5 w-5 text-violet-400/70" />
      </div>

      <p className="relative text-sm text-zinc-400 mb-1">
        Issued on{' '}
        <span className="text-zinc-200">
          {new Date(cert.issueDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </p>
      <p className="relative text-xs font-mono text-zinc-600 mb-6 break-all">{cert.certificateId}</p>

      <div className="relative flex flex-wrap gap-2">
        <button
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-white disabled:opacity-50 transition-colors"
        >
          {downloading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download PDF
        </button>
        <button
          onClick={handleShareLinkedIn}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <Linkedin className="h-4 w-4" />
          Share on LinkedIn
        </button>
        <a
          href={verifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-800 px-3 py-2.5 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-colors"
          aria-label="View verification page"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </motion.div>
  );
}

function LockedView({
  progress,
  resumeOrder,
  onContinue,
}: {
  progress: import('../types').AcademyProgress;
  resumeOrder: number;
  onContinue: () => void;
}) {
  return (
    <motion.div
      key="locked"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6">
        <div className="mb-2 flex justify-between text-sm text-zinc-400">
          <span>Academy Progress</span>
          <span className="font-semibold text-violet-300">{progress.percentage}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-600 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          {progress.completed}/{progress.total || TOTAL_CHAPTERS} chapters completed
        </p>
      </div>

      <div className="spotlight-card rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-12 text-center">
        <Lock className="mx-auto mb-4 h-16 w-16 text-zinc-600" />
        <h3 className="mb-2 text-xl font-semibold text-zinc-100">Certification Locked</h3>
        <p className="mb-4 text-zinc-400">
          Complete all {TOTAL_CHAPTERS} academy chapters with ≥80% quiz scores to earn your official
          certificate.
        </p>
        <p className="mb-6 text-2xl font-bold text-violet-400">
          {progress.completed} / {progress.total || TOTAL_CHAPTERS}
        </p>
        <button
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 font-semibold text-white hover:bg-violet-600 transition-colors"
        >
          Continue Learning
          <span className="text-xs text-violet-200">→ Ch {resumeOrder}</span>
        </button>
      </div>
    </motion.div>
  );
}

function EarnedView({
  certificates,
  displayName,
}: {
  certificates: Certificate[];
  displayName: string;
}) {
  return (
    <motion.div
      key="earned"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-zinc-100"
        >
          Your Achievements
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-2 text-lg text-zinc-400"
        >
          {certificates.length === 1
            ? 'You have earned your official AutoTune-SQL certification.'
            : `${certificates.length} verified credentials on record.`}
        </motion.p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {certificates.map((cert, index) => (
          <CertificateCard
            key={cert.id}
            cert={cert}
            displayName={displayName}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}

export const Certificates = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [progress, setProgress] = useState<import('../types').AcademyProgress>({
    completed: 0,
    total: TOTAL_CHAPTERS,
    percentage: 0,
  });
  const [resumeOrder, setResumeOrder] = useState(1);
  const [loading, setLoading] = useState(true);

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || 'AutoTune Graduate';

  const hasCertificates = !loading && certificates.length > 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [certs, prog, catalog] = await Promise.all([
          api.getMyCertificates(),
          api.getProgress(),
          api.getAcademyCatalog().catch(() => null),
        ]);
        setCertificates(certs);
        setProgress(prog);

        if (catalog?.chapters?.length) {
          const sorted = [...catalog.chapters].sort(
            (a, b) => (a.globalOrder ?? 0) - (b.globalOrder ?? 0)
          );
          const firstIncomplete = sorted.find((ch) => ch.isCompleted !== true);
          setResumeOrder(
            firstIncomplete?.globalOrder ?? catalog.resumeOrder ?? 1
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const handleContinueLearning = () => {
    navigate(`/learn/chapter/${resumeOrder}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-zinc-800/50" />
        <div className="h-64 animate-shimmer rounded-2xl bg-zinc-800/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BrandStrip title="Certifications" subtitle="Your official AutoTune-SQL credentials" />
      <AnimatePresence mode="wait">
      {hasCertificates ? (
        <EarnedView certificates={certificates} displayName={displayName} />
      ) : (
        <LockedView
          progress={progress}
          resumeOrder={resumeOrder}
          onContinue={handleContinueLearning}
        />
      )}
      </AnimatePresence>
    </div>
  );
};
