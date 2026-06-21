import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Download, Linkedin, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '../components/brand/Logo';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  generateCertificatePdf,
  getLinkedInShareUrl,
} from '../services/certificateService';

export function CertificateView() {
  const { certId } = useParams<{ certId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [certType, setCertType] = useState('SQL Optimization Specialist');
  const [issueDate, setIssueDate] = useState('');
  const [holderName, setHolderName] = useState('');
  const [verificationLink, setVerificationLink] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!certId) return;
      try {
        const result = await api.verifyCertificate(certId);
        setValid(result.valid);
        if (result.valid && result.certificate) {
          const cert = result.certificate;
          setCertType(cert.type || 'SQL Optimization Specialist');
          setIssueDate(
            new Date(cert.issueDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          );
          setHolderName(
            cert.userName ||
              (cert.user?.firstName && cert.user?.lastName
                ? `${cert.user.firstName} ${cert.user.lastName}`
                : cert.user?.email || 'AutoTune Graduate')
          );
          setVerificationLink(
            cert.verificationLink || `${window.location.origin}/verify/${certId}`
          );
        }
      } catch {
        setValid(false);
      } finally {
        setLoading(false);
      }
    };
    void verify();
  }, [certId]);

  const handleDownload = async () => {
    if (!certId) return;
    setDownloading(true);
    try {
      if (user) {
        try {
          await api.downloadCertificate(certId);
          toast.success('Certificate downloaded!');
          return;
        } catch {
          /* fall through to client PDF */
        }
      }

      await generateCertificatePdf({
        userName: holderName,
        certificateId: certId,
        verificationLink,
        issueDate,
      });
      toast.success('Certificate downloaded!');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 animate-pulse h-96 bg-zinc-800/40 rounded-2xl" />
    );
  }

  if (!valid || !certId) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <ShieldCheck className="w-12 h-12 text-zinc-600 mx-auto" />
        <p className="text-zinc-400">Certificate not found or invalid.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl bg-violet-500 text-white font-semibold"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const linkedInUrl = getLinkedInShareUrl(verificationLink);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-10 md:p-14"
      >
        <div className="pointer-events-none absolute -top-20 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute inset-4 border border-zinc-800/80 rounded-xl pointer-events-none" />

        <div className="relative flex items-center justify-between mb-10">
          <Logo size="md" showText showTagline />
          <span className="text-xs font-mono text-zinc-500">{certId}</span>
        </div>

        <div className="relative text-center space-y-4 py-8">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
            AutoTune-SQL Official Certification
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">{certType}</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-widest">Awarded to</p>
          <p className="text-4xl md:text-5xl font-bold text-white">{holderName}</p>
          <p className="text-zinc-400 max-w-xl mx-auto">
            For successfully completing all 36 chapters of the SQL Optimization Academy.
          </p>
        </div>

        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-zinc-800">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <ShieldCheck className="w-5 h-5" />
            Verified credential
          </div>
          <p className="text-sm text-zinc-400">Issued on {issueDate}</p>
          <Award className="w-10 h-10 text-amber-400/80" />
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-zinc-100 text-zinc-900 font-bold hover:bg-white disabled:opacity-50 transition-colors"
        >
          {downloading ? (
            <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          Download PDF
        </button>
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <Linkedin className="w-5 h-5" />
          Share on LinkedIn
        </a>
        {user && (
          <button
            onClick={() => navigate('/certificates')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            My Certificates
          </button>
        )}
      </div>
    </div>
  );
}
