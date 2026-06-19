import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Zap, Copy, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import type { AnalysisResult } from '../types.js';
import { toast } from 'sonner';

export const Studio = () => {
  const [sqlInput, setSqlInput] = useState<string>(`-- Paste your SQL query here
SELECT *
FROM users u
JOIN orders o ON u.id = o.user_id;`);
  const [activeTab, setActiveTab] = useState<'optimized' | 'explanation' | 'prediction'>('optimized');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!sqlInput.trim()) return;

    setLoading(true);
    try {
      const response = await api.analyzeQuery(sqlInput);
      setResult(response);
      toast.success('Query analyzed successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const RiskMeter = ({ probability }: { probability: number }) => {
    const color = probability > 60 ? 'bg-red-500' : probability > 30 ? 'bg-yellow-500' : 'bg-emerald-500';
    const label = probability > 60 ? 'HIGH RISK' : probability > 30 ? 'MEDIUM RISK' : 'LOW RISK';

    return (
      <div className="p-8 bg-gray-900 rounded-xl border border-gray-800">
        <h3 className="text-xl font-semibold text-white mb-6">ML Slowness Prediction</h3>
        <div className="space-y-6">
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${
              probability > 60 ? 'text-red-400' : probability > 30 ? 'text-yellow-400' : 'text-emerald-400'
            }`}>
              {probability.toFixed(1)}%
            </div>
            <div className={`text-lg font-medium ${
              probability > 60 ? 'text-red-300' : probability > 30 ? 'text-yellow-300' : 'text-emerald-300'
            }`}>
              {label}
            </div>
          </div>
          <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} transition-all duration-500`}
              style={{ width: `${Math.min(probability, 100)}%` }}
            />
          </div>
          {result && (
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-300">{result.data.mlAdvice}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Optimization Studio</h1>
        <p className="text-gray-400">Analyze, optimize, and refine your SQL queries</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Original SQL</h3>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Analyze & Optimize
                </>
              )}
            </button>
          </div>
          <div className="h-[500px] border border-gray-800 rounded-xl overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme="vs-dark"
              value={sqlInput}
              onChange={(value) => setSqlInput(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on'
              }}
            />
          </div>
        </div>

        {/* Right Panel: Tabs */}
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-gray-800 pb-2">
            {[
              { id: 'optimized', label: 'Optimized SQL', icon: CheckCircle2 },
              { id: 'explanation', label: 'AI Explanation', icon: AlertCircle },
              { id: 'prediction', label: 'ML Prediction', icon: Zap }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gray-800 text-blue-400 border border-b-0 border-gray-800'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="h-[500px] border border-gray-800 rounded-xl overflow-hidden bg-gray-900">
            {activeTab === 'optimized' && (
              <div className="h-full flex flex-col">
                <div className="p-3 border-b border-gray-800 flex justify-end">
                  <button
                    onClick={() => handleCopy(result?.data.queryLog.optimizedQuery || '')}
                    disabled={!result?.data.queryLog.optimizedQuery}
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
                    value={result?.data.queryLog.optimizedQuery || '-- No optimization yet'}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      readOnly: true
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'explanation' && (
              <div className="p-6">
                {result?.data.queryLog.explanation ? (
                  <div className="prose prose-invert">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {result.data.queryLog.explanation}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No explanation available yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'prediction' && (
              <div className="p-4">
                <RiskMeter probability={result?.data.mlPrediction.probability || 0} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
