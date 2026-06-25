import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { Zap, Copy, Loader2, AlertCircle, CheckCircle2, AlertTriangle, Database, Lightbulb, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { BrandStrip } from '../components/brand/BrandStrip';
import type { AnalysisResult, OptimizationResult, DbConnection, QueryAnalysisError } from '../types';
import { toast } from 'sonner';

interface OptimizerState {
  analysisData: AnalysisResult | null;
  optimizationData: OptimizationResult | null;
  mlData: {
    probability: number;
    prediction: string;
    advice: string;
    reasons: string[];
  } | null;
}

type StructuredQueryError = QueryAnalysisError & { partial?: AnalysisResult };

function getErrorFixHint(error: QueryAnalysisError): string {
  if (error.hint) return error.hint;

  switch (error.code) {
    case '42P01':
      return 'Check if the table name is spelled correctly or if you are connected to the correct database.';
    case '42703':
      return 'Verify the column exists on the referenced table and matches the alias you are using.';
    case '42601':
      return 'Review your SQL syntax for missing commas, parentheses, or invalid keywords.';
    case '28P01':
    case '28000':
      return 'Verify database credentials and user permissions for this connection.';
    default:
      return 'Review your query and try again.';
  }
}

function isRedBorderCategory(category: string) {
  return category === 'Syntax' || category === 'Schema' || category === 'Connection' || category === 'Validation';
}

const ErrorCard = ({ error }: { error: StructuredQueryError }) => {
  const isRed = isRedBorderCategory(error.errorCategory);

  return (
    <div
      className={`p-6 rounded-2xl border-2 ${isRed ? 'border-red-500/60 bg-red-950/20' : 'border-yellow-500/60 bg-yellow-950/20'
        }`}
    >
      <div className="flex items-start gap-4">
        <AlertCircle className={`w-10 h-10 flex-shrink-0 ${isRed ? 'text-red-400' : 'text-yellow-400'}`} />
        <div className="text-left space-y-3 flex-1">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${isRed ? 'text-red-300' : 'text-yellow-300'}`}>
              {error.errorCategory} Error{error.code ? ` · ${error.code}` : ''}
            </p>
            <h3 className={`text-lg font-semibold mt-1 ${isRed ? 'text-red-200' : 'text-yellow-200'}`}>
              {error.message}
            </h3>
          </div>
          <div className={`flex items-start gap-2 p-3 rounded-lg ${isRed ? 'bg-red-900/30' : 'bg-yellow-900/30'}`}>
            <Lightbulb className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isRed ? 'text-red-300' : 'text-yellow-300'}`} />
            <p className={`text-sm ${isRed ? 'text-red-100/90' : 'text-yellow-100/90'}`}>
              <span className="font-medium">How to fix: </span>
              {getErrorFixHint(error)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PerformanceWarningCard = ({ title, items }: { title: string; items: string[] }) => (
  <div className="p-4 rounded-2xl border-2 border-yellow-500/60 bg-yellow-950/20 mb-4">
    <div className="flex items-center gap-2 mb-2">
      <AlertTriangle className="w-5 h-5 text-yellow-400" />
      <h4 className="text-sm font-semibold text-yellow-200">{title}</h4>
    </div>
    <ul className="space-y-1">
      {items.map((item, idx) => (
        <li key={idx} className="text-sm text-yellow-100/90">
          • {item}
        </li>
      ))}
    </ul>
  </div>
);

export const Optimizer = () => {
  const [sqlInput, setSqlInput] = useState<string>(`/* Performance Test */
-- Checking user orders
SELECT u.name, o.total 
FROM users u
JOIN orders o ON u.id = o.user_id;`);
  const [activeTab, setActiveTab] = useState<'optimized' | 'explanation' | 'prediction'>('optimized');
  const [optimizerState, setOptimizerState] = useState<OptimizerState>({
    analysisData: null,
    optimizationData: null,
    mlData: null,
  });
  const [loading, setLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({
    optimized: false,
    explanation: false,
    prediction: false,
  });
  const [queryError, setQueryError] = useState<StructuredQueryError | null>(null);
  const [performanceWarnings, setPerformanceWarnings] = useState<string[]>([]);
  const [connections, setConnections] = useState<DbConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  const editorOptions = {
    minimap: { enabled: !isMobile },
    fontSize: isMobile ? 15 : 14,
    wordWrap: 'on' as const,
    lineNumbers: isMobile ? ('off' as const) : ('on' as const),
    scrollBeyondLastLine: false,
    padding: { top: isMobile ? 16 : 12 },
    scrollbar: isMobile ? { vertical: 'hidden' as const, horizontal: 'hidden' as const } : undefined,
  };

  const scrollToResults = () => {
    setActiveTab('optimized');
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const data = await api.getConnections();
        setConnections(data);
      } catch (err) {
        console.error('Failed to fetch connections:', err);
      }
    };
    fetchConnections();
  }, []);

  const extractReasonsFromExplain = (explainPlan: unknown): string[] => {
    const reasons: string[] = [];
    if (!explainPlan) return reasons;

    const checkPlan = (plan: Record<string, unknown>) => {
      if (plan['Node Type'] === 'Seq Scan') {
        reasons.push('Sequential Scan detected - consider adding an index');
      }
      if (typeof plan['Total Cost'] === 'number' && plan['Total Cost'] > 1000) {
        reasons.push('High query cost detected');
      }
      const nested = plan['Plans'] as Record<string, unknown>[] | undefined;
      nested?.forEach(checkPlan);
    };

    if (Array.isArray(explainPlan)) {
      explainPlan.forEach(checkPlan);
    } else {
      checkPlan(explainPlan as Record<string, unknown>);
    }

    return reasons;
  };

  const handleAnalyze = async () => {
    if (!sqlInput.trim()) return;

    setLoading(true);
    setQueryError(null);
    setPerformanceWarnings([]);
    setTabLoading({ optimized: true, explanation: true, prediction: true });
    setOptimizerState({ analysisData: null, optimizationData: null, mlData: null });

    try {
      const analysis = await api.analyzeQueryOrThrow(sqlInput, selectedConnectionId || undefined);

      const warnings: string[] = [];
      if (analysis.queryLog.logicFlaws && Array.isArray(analysis.queryLog.logicFlaws)) {
        analysis.queryLog.logicFlaws.forEach((flaw: { message?: string }) => {
          if (flaw.message) warnings.push(flaw.message);
        });
      }
      if (analysis.isSlow) {
        warnings.push('Query execution time exceeds the performance threshold.');
      }
      setPerformanceWarnings(warnings);

      const mlReasons = extractReasonsFromExplain(analysis.queryLog.explainPlan);
      const mlData = {
        probability: analysis.mlPrediction.probability,
        prediction: analysis.mlPrediction.prediction,
        advice: analysis.mlPrediction.advice || 'No additional advice available.',
        reasons: mlReasons,
      };

      setOptimizerState((prev) => ({
        ...prev,
        analysisData: analysis,
        mlData,
      }));

      try {
        const optimization = await api.optimizeQuery(analysis.id);
        setOptimizerState((prev) => ({
          ...prev,
          optimizationData: optimization,
        }));
        toast.success('Query analyzed and optimized!');
      } catch (optErr) {
        console.error('Optimization failed:', optErr);
        toast.error('Analysis complete, but optimization failed');
      }
    } catch (err: unknown) {
      const structured = err as StructuredQueryError;
      if (structured.errorCategory && structured.message) {
        setQueryError(structured);
        toast.error(`${structured.errorCategory} Error: ${structured.message}`);
        return;
      }

      console.error(err);
      const message = (err as Error)?.message || 'An error occurred';
      setQueryError({
        errorCategory: 'Syntax',
        message,
        hint: 'Review your query and try again.',
      });
      toast.error('Failed to analyze query');
    } finally {
      setLoading(false);
      setTabLoading({ optimized: false, explanation: false, prediction: false });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const RiskMeter = ({
    probability,
    reasons,
    advice,
  }: {
    probability: number;
    reasons: string[];
    advice: string;
  }) => {
    const color = probability > 60 ? 'bg-red-500' : probability > 30 ? 'bg-yellow-500' : 'bg-emerald-500';
    const label = probability > 60 ? 'HIGH RISK' : probability > 30 ? 'MEDIUM RISK' : 'LOW RISK';

    return (
      <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800 sm:p-8">
        <h3 className="text-xl font-semibold text-white mb-6">ML Risk Score</h3>
        <div className="space-y-6">
          <div className="text-center">
            <div
              className={`text-5xl font-bold mb-2 sm:text-6xl ${probability > 60 ? 'text-red-400' : probability > 30 ? 'text-yellow-400' : 'text-emerald-400'
                }`}
            >
              {probability.toFixed(1)}%
            </div>
            <div
              className={`text-lg font-medium ${probability > 60 ? 'text-red-300' : probability > 30 ? 'text-yellow-300' : 'text-emerald-300'
                }`}
            >
              {label}
            </div>
          </div>
          <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} transition-all duration-500`}
              style={{ width: `${Math.min(probability, 100)}%` }}
            />
          </div>
          {reasons.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-400">Detected Issues:</h4>
              <div className="space-y-2">
                {reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-300">{reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-300">{advice}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (queryError && activeTab === 'optimized') {
      return (
        <div className="p-6 flex flex-col items-center justify-center h-full">
          <ErrorCard error={queryError} />
        </div>
      );
    }

    if (tabLoading[activeTab]) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
          <p className="text-gray-400">AI is thinking...</p>
        </div>
      );
    }

    if (activeTab === 'optimized') {
      const optimizedQuery = optimizerState.optimizationData?.optimizedQuery || '-- Run Analyze to generate optimized SQL';
      return (
        <div className="h-full flex flex-col">
          {performanceWarnings.length > 0 && (
            <div className="p-4 border-b border-gray-800">
              <PerformanceWarningCard title="Performance Warnings" items={performanceWarnings} />
            </div>
          )}
          <div className="p-3 border-b border-gray-800 flex justify-end">
            <button
              onClick={() => handleCopy(optimizedQuery)}
              disabled={!optimizerState.optimizationData?.optimizedQuery}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-md text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme="vs-dark"
              value={optimizedQuery}
              options={{ ...editorOptions, readOnly: true }}
              key={optimizedQuery}
            />
          </div>
        </div>
      );
    }

    if (activeTab === 'explanation') {
      const explanation = optimizerState.optimizationData?.explanation;
      return (
        <div className="p-6">
          {explanation ? (
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{explanation}</p>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No AI optimization explanation yet</p>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'prediction') {
      return (
        <div className="p-4">
          {optimizerState.mlData ? (
            <RiskMeter
              probability={optimizerState.mlData.probability}
              reasons={optimizerState.mlData.reasons}
              advice={optimizerState.mlData.advice}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Run Analyze to see ML Risk Score</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4 pb-28 sm:space-y-6 sm:pb-0">
      <BrandStrip title="SQL Optimizer" subtitle="Analyze, score risk, and rewrite queries with AI" />
      <div>
        <h1 className="mb-2 text-3xl font-bold tracking-tighter text-white sm:text-4xl sm:tracking-tight">SQL Optimizer</h1>
        <p className="text-base leading-relaxed text-gray-400">Analyze, score risk, and optimize your SQL queries with AI</p>
      </div>

      {/* Force flex-col on mobile */}
      <div className="flex flex-col gap-4 sm:gap-6 lg:grid lg:grid-cols-2">
        <div className="mobile-edge-card -mx-4 min-w-0 space-y-4 rounded-none border-y border-gray-800/80 bg-zinc-900/30 px-4 py-5 sm:mx-0 sm:rounded-2xl sm:border sm:px-5 lg:border-gray-800">
          <div className="hidden flex-col gap-4 sm:flex sm:flex-row sm:items-end sm:justify-between lg:flex">
            <div className="w-full flex-1">
              <label className="mb-2 block text-sm font-semibold text-gray-300">Database</label>
              <select
                value={selectedConnectionId || ''}
                onChange={(e) => setSelectedConnectionId(e.target.value || null)}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Demo Database</option>
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden w-full shrink-0 sm:block sm:w-auto lg:block">
              <motion.button
                onClick={handleAnalyze}
                disabled={loading}
                whileTap={{ scale: 0.96 }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Analyze
                  </>
                )}
              </motion.button>
            </div>
          </div>

          <div className="sm:hidden">
            <label className="mb-2 block text-sm font-semibold text-gray-300">Database</label>
            <select
              value={selectedConnectionId || ''}
              onChange={(e) => setSelectedConnectionId(e.target.value || null)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Demo Database</option>
              {connections.map((conn) => (
                <option key={conn.id} value={conn.id}>
                  {conn.name}
                </option>
              ))}
            </select>
          </div>

          <h3 className="text-lg font-semibold text-white sm:text-xl">Original SQL</h3>
          {/* Responsive height: min-h-[350px] on mobile, fixed on larger */}
          <div className="min-h-[350px] overflow-hidden rounded-2xl border border-gray-800 sm:h-[400px] lg:h-[500px]">
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme="vs-dark"
              value={sqlInput}
              onChange={(value) => setSqlInput(value || '')}
              options={editorOptions}
            />
          </div>
        </div>

        <div
          ref={resultsRef}
          className="mobile-edge-card -mx-4 min-w-0 space-y-4 rounded-none border-y border-gray-800/80 bg-zinc-900/30 px-4 py-5 sm:mx-0 sm:rounded-2xl sm:border sm:px-5 lg:border-gray-800"
        >
          <div className="-mx-1 flex gap-2 overflow-x-auto scrollbar-thin border-b border-gray-800 pb-2 sm:mx-0">
            {[
              { id: 'optimized', label: 'Optimization', icon: CheckCircle2 },
              { id: 'explanation', label: 'Explanation', icon: AlertCircle },
              { id: 'prediction', label: 'ML Risk', icon: Zap },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                whileTap={{ scale: 0.96 }}
                className={`flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-semibold transition-all ${activeTab === tab.id
                    ? 'border border-b-0 border-gray-800 bg-gray-800 text-blue-400'
                    : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tabLoading[tab.id] && <Loader2 className="h-3 w-3 animate-spin" />}
              </motion.button>
            ))}
          </div>
          <div className="min-h-[350px] overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 sm:h-[400px] lg:h-[500px]">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* ─── Fixed-Bottom Glassmorphism Action Bar (Mobile Only) ─── */}
      <div className="fixed inset-x-0 bottom-0 z-40 glass-action-bar px-4 py-3 safe-bottom sm:hidden">
        <div className="mx-auto flex max-w-lg gap-3">
          <motion.button
            onClick={handleAnalyze}
            disabled={loading}
            whileTap={{ scale: 0.96 }}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Analyze
              </>
            )}
          </motion.button>
          <motion.button
            onClick={scrollToResults}
            disabled={!optimizerState.analysisData && !optimizerState.optimizationData}
            whileTap={{ scale: 0.96 }}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-700 bg-gray-800 py-4 text-base font-bold text-white disabled:opacity-40"
          >
            <Sparkles className="h-5 w-5 text-violet-400" />
            Results
          </motion.button>
        </div>
      </div>
    </div>
  );
};
