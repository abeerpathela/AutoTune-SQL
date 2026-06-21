import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, ExternalLink, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';

export const Certificates = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const data = await api.getMyCertificates();
        setCertificates(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const generateCertificate = async () => {
    setGenerating(true);
    try {
      const result = await api.generateCertificate('SQL Optimization Fundamentals');
      const newCert = 'certificate' in result ? result.certificate : result;
      setCertificates([newCert, ...certificates]);
      toast.success('Certificate generated successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-zinc-100 mb-2"
          >
            Your Certificates
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-400"
          >
            Showcase your SQL optimization skills
          </motion.p>
        </div>
        <button
          onClick={generateCertificate}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 disabled:opacity-50 transition-colors"
        >
          {generating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          {generating ? 'Generating...' : 'Generate Certificate'}
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-shimmer h-64 bg-zinc-800/40 rounded-2xl" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="spotlight-card rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-12 text-center">
          <Award className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-100 mb-2">No Certificates Yet</h3>
          <p className="text-zinc-400 mb-6">Complete all academy chapters to earn your first certificate!</p>
          <button
            onClick={generateCertificate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {generating ? 'Generating...' : 'Try to Generate'}
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert, index) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="spotlight-card rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-yellow-900" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-zinc-100">{cert.type}</h3>
                    <p className="text-sm text-zinc-500">Issued {new Date(cert.issueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-xs text-zinc-600 font-mono mb-4 break-all">
                  Certificate ID: {cert.certificateId}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => api.downloadCertificate(cert.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/40 text-zinc-100 hover:bg-zinc-700/40 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => window.open(cert.verificationLink, '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Verify
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
