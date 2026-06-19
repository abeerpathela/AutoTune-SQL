import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Zap, Copy, Loader2, AlertCircle, CheckCircle2, AlertTriangle, Database } from 'lucide-react';
import { api } from '../lib/api';
import type { AnalysisResult, OptimizationResult, DbConnection } from '../types.js';
import { toast } from 'sonner';

interface StudioState {
  analysisData: AnalysisResult | null;
  optimizationData: OptimizationResult | null;
  mlData: {
    probability: number;
    prediction: string;
    advice: string;
    reasons: string[];
  } | null;
}

export const Studio = () => {
  const [sqlInput, setSqlInput] = useState<string>(`-- Paste your SQL query here
SELECT *
FROM users u
JOIN orders o ON u.id = o.user_id;`);
  const [activeTab, setActiveTab] = useState<'optimized' | 'explanation' | 'prediction'>('optimized');
  const [studioState, setStudioState] = useState<StudioState>({
    analysisData: null,
    optimizationData: null,
    mlData: null
  });
  const [loading, setLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({
    optimized: false,
    explanation: false,
    prediction: false
  });
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<DbConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

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

  const extractReasonsFromExplain = (explainPlan: any): string[] => {
    const reasons: string[] = [];
    if (!explainPlan) return reasons;
    
    const checkPlan = (plan: any) => {
      if (plan['Node Type'] === 'Seq Scan') {
        reasons.push('Sequential Scan detected - consider adding an index');
      }
      if (plan['Total Cost'] && plan['Total Cost'] > 1000) {
        reasons.push('High query cost detected');
      }
      if (plan['Plans']) {
        plan['Plans'].forEach(checkPlan);
      }
    };
    
    if (Array.isArray(explainPlan)) {
      explainPlan.forEach(checkPlan);
    } else {
      checkPlan(explainPlan);
    }
    
    return reasons;
  };

  const handleAnalyzeAndOptimize = async () => {
    if (!sqlInput.trim()) return;

    setLoading(true);
    setError(null);
    setTabLoading({ optimized: true, explanation: true, prediction: false });
    setStudioState({ analysisData: null, optimizationData: null, mlData: null });

    try {
      // Step 1: Analyze Query
      const analysisResponse = await api.analyzeQuery(sqlInput, selectedConnectionId || undefined);
      
      // Check for syntax errors
      if (!analysisResponse.data.queryLog.isSyntaxValid && analysisResponse.data.queryLog.postgresError) {
        setError(analysisResponse.data.queryLog.postgresError);
        toast.error('Invalid SQL syntax');
        setTabLoading({ optimized: false, explanation: false, prediction: false });
        return;
      }

      // Update ML data
      const mlReasons = extractReasonsFromExplain(analysisResponse.data.queryLog.explainPlan);
      const mlData = {
        probability: analysisResponse.data.mlPrediction.probability,
        prediction: analysisResponse.data.mlPrediction.prediction,
        advice: analysisResponse.data.mlPrediction.advice,
        reasons: mlReasons
      };

      setStudioState(prev => ({
        ...prev,
        analysisData: analysisResponse,
        mlData
      }));
      setTabLoading(prev => ({ ...prev, prediction: false }));

      // Step 2: Immediately optimize using the returned id
      try {
        const optimizationResponse = await api.optimizeQuery(analysisResponse.data.id);
        setStudioState(prev => ({
          ...prev,
          optimizationData: optimizationResponse.data
        }));
        toast.success('Query optimized successfully!');
      } catch (optErr) {
        console.error('Optimization failed:', optErr);
        toast.error('Optimization failed, but analysis completed');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'An error occurred');
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

  const RiskMeter = ({ probability, reasons, advice }: { probability: number; reasons: string[]; advice: string }) => {
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
    if (error && activeTab === 'optimized') {
      return (
        <div className="p-6 flex flex-col items-center justify-center h-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">Syntax Error</h3>
          <p className="text-gray-400 whitespace-pre-wrap font-mono text-sm">{error}</p>
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
      const optimizedQuery = studioState.optimizationData?.optimizedQuery || '-- No optimization yet';
      return (
        <div className="h-full flex flex-col">
          <div className="p-3 border-b border-gray-800 flex justify-end">
            <button
              onClick={() => handleCopy(optimizedQuery)}
              disabled={!studioState.optimizationData?.optimizedQuery}
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
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                readOnly: true
              }}
              key={optimizedQuery}
            />
          </div>
        </div>
      );
    }

    if (activeTab === 'explanation') {
      const explanation = studioState.optimizationData?.explanation;
      return (
        <div className="p-6">
          {explanation ? (
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {explanation}
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No explanation available yet</p>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'prediction') {
      return (
        <div className="p-4">
          {studioState.mlData ? (
            <RiskMeter 
              probability={studioState.mlData.probability}
              reasons={studioState.mlData.reasons}
              advice={studioState.mlData.advice}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No ML prediction available yet</p>
            </div>
          )}
        </div>
      );
    }

    return null;
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-1">Database</label>
              <select
                value={selectedConnectionId || ''}
                onChange={(e) => setSelectedConnectionId(e.target.value || null)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Demo Database</option>
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-shrink-0 mt-6">
              <button
                onClick={handleAnalyzeAndOptimize}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Analyze & Optimize
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Original SQL</h3>
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
                {tabLoading[tab.id] && <Loader2 className="w-3 h-3 animate-spin" />}
              </button>
            ))}
          </div>

          <div className="h-[500px] border border-gray-800 rounded-xl overflow-hidden bg-gray-900">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
