import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, ExternalLink, Lock, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { api } from '../lib/api';
import { toast } from 'sonner';
import Logo from '../assets/WEBSITE_LOGO.svg';
import { useAuth } from '../contexts/AuthContext';

const TOTAL_CHAPTERS = 30;

function CertificatePreview({
  name,
  certId,
  previewRef,
}: {
  name: string;
  certId: string;
  previewRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={previewRef}
      className="w-[900px] h-[600px] bg-zinc-950 border-8 border-zinc-700 rounded-lg p-12 flex flex-col items-center justify-between"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      <div className="w-full flex items-center justify-between">
        <img src={Logo} alt="AutoTune-SQL" className="h-14" />
        <p className="text-xs text-zinc-500 font-mono">{certId}</p>
      </div>
      <div className="text-center space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-violet-400">Certificate of Mastery</p>
        <h1 className="text-4xl font-bold text-zinc-100">SQL Optimization Professional</h1>
        <p className="text-zinc-400">This certifies that</p>
        <p className="text-3xl text-violet-300 font-semibold">{name}</p>
        <p className="text-zinc-400 max-w-lg mx-auto">
          has successfully completed all 30 chapters of the AutoTune-SQL Academy with ≥80% quiz proficiency
        </p>
      </div>
      <div className="w-full flex items-end justify-between border-t border-zinc-800 pt-6">
        <div>
          <p className="text-xs text-zinc-500">Issued {new Date().toLocaleDateString()}</p>
          <p className="text-sm text-zinc-300 mt-1 italic">Verified by AutoTune-SQL ML Engine</p>
        </div>
        <Award className="w-12 h-12 text-amber-400" />
      </div>
    </div>
  );
}

export const Certificates = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [progress, setProgress] = useState({ completed: 0, total: TOTAL_CHAPTERS, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || 'AutoTune Graduate';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [certs, prog] = await Promise.all([api.getMyCertificates(), api.getProgress()]);
        setCertificates(certs);
        setProgress(prog);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const downloadPdfFromPreview = async (certId: string) => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: '#09090b' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [900, 600] });
    pdf.addImage(imgData, 'PNG', 0, 0, 900, 600);
    pdf.save(`AutoTune-Certificate-${certId}.pdf`);
  };

  const handleUnlockCertification = async () => {
    if (progress.completed < progress.total || progress.percentage < 100) {
      setShowLockedModal(true);
      return;
    }

    setGenerating(true);
    try {
      const cert = await api.generateCertificate('SQL Optimization Professional');
      setCertificates([cert, ...certificates]);
      const certId = cert.certificateId || cert.id;
      await new Promise((r) => setTimeout(r, 300));
      await downloadPdfFromPreview(certId);
      toast.success('Certification unlocked and PDF downloaded!');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err as Error)?.message ||
        'Failed to generate certificate';
      toast.error(message);
      if (message.includes('complete')) setShowLockedModal(true);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hidden render target for PDF */}
      <div className="fixed -left-[9999px] top-0">
        <CertificatePreview
          name={displayName}
          certId={`AT-SQL-PREVIEW-${Date.now()}`}
          previewRef={previewRef}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-zinc-100 mb-2"
          >
            Your Certification
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-400"
          >
            {progress.completed}/{progress.total || TOTAL_CHAPTERS} chapters completed ({progress.percentage}%)
          </motion.p>
        </div>
        <button
          onClick={handleUnlockCertification}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 disabled:opacity-50 transition-colors"
        >
          {generating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : progress.percentage >= 100 ? (
            <Award className="w-5 h-5" />
          ) : (
            <Lock className="w-5 h-5" />
          )}
          {generating ? 'Generating...' : 'Unlock My Certification'}
        </button>
      </div>

      {loading ? (
        <div className="animate-shimmer h-64 bg-zinc-800/40 rounded-2xl" />
      ) : certificates.length === 0 ? (
        <div className="spotlight-card rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-12 text-center">
          <Lock className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-100 mb-2">Certification Locked</h3>
          <p className="text-zinc-400 mb-6">
            Complete all {TOTAL_CHAPTERS} academy chapters with ≥80% quiz scores to unlock your certificate.
          </p>
          <p className="text-2xl font-bold text-violet-400 mb-6">
            {progress.completed} / {progress.total || TOTAL_CHAPTERS}
          </p>
          <button
            onClick={() => navigate('/learn/chapter/1')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600"
          >
            Continue Learning
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {certificates.map((cert, index) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="spotlight-card rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                  <Award className="w-6 h-6 text-yellow-900" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">{cert.type}</h3>
                  <p className="text-sm text-zinc-500">Issued {new Date(cert.issueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 font-mono mb-4 break-all">{cert.certificateId}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => api.downloadCertificate(cert.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/40 text-zinc-100 hover:bg-zinc-700/40 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Server PDF
                </button>
                <button
                  onClick={() => downloadPdfFromPreview(cert.certificateId)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Client PDF
                </button>
                <button
                  onClick={() => window.open(cert.verificationLink, '_blank')}
                  className="px-4 py-2 rounded-xl bg-zinc-800/40 text-zinc-400 hover:text-zinc-100"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showLockedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-8 relative"
            >
              <button
                onClick={() => setShowLockedModal(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
              <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-100 text-center mb-2">⚠️ Certification Locked</h3>
              <p className="text-zinc-400 text-center mb-6">
                You have completed {progress.completed}/{progress.total || TOTAL_CHAPTERS} chapters. Pass all quizzes
                with ≥80% to unlock your certification.
              </p>
              <Link
                to="/learn/chapter/1"
                onClick={() => setShowLockedModal(false)}
                className="block w-full text-center py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600"
              >
                Continue Learning
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
