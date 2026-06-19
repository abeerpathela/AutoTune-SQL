import React, { useEffect, useState } from 'react';
import type { TrainingStats } from '../types.js';
import { api } from '../lib/api';
import { Target, Brain, Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const StatCard = ({
  title,
  value,
  icon: Icon,
  color
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
}) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-400 font-medium text-sm">{title}</h3>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="text-3xl font-bold text-white">{value}</div>
  </div>
);

export const MLStats = () => {
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getTrainingStats();
      setStats(data);
      return data;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    setTraining(true);
    try {
      const data = await api.trainModel();
      setStats(data);
      toast.success('Model trained successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setTraining(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const currentStats = await loadStats();
      
      // Auto-train if needed
      if (currentStats && (!currentStats.success || currentStats.recordCount === 0)) {
        console.log('Auto-training model...');
        setTraining(true);
        try {
          const newStats = await api.trainModel();
          setStats(newStats);
          toast.success('Model trained automatically!');
        } catch (err) {
          console.error('Auto-train failed:', err);
        } finally {
          setTraining(false);
        }
      }
    };
    
    initialize();
  }, []);

  if (loading || training) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-gray-300 text-lg">
          {training ? 'Training model for first use...' : 'Loading ML statistics...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">ML Model Stats</h1>
          <p className="text-gray-400">Monitor your Random Forest classifier performance</p>
        </div>
        <button
          onClick={handleTrain}
          disabled={training}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {training ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Training...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Train Model
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Accuracy"
          value={stats?.accuracy ? `${stats.accuracy}%` : 'N/A'}
          icon={Target}
          color="bg-purple-600"
        />
        <StatCard
          title="Training Records"
          value={stats?.recordCount?.toLocaleString() || 0}
          icon={Brain}
          color="bg-blue-600"
        />
        <StatCard
          title="True Positives"
          value={stats?.confusionMatrix?.truePositive?.toLocaleString() || 0}
          icon={CheckCircle2}
          color="bg-emerald-600"
        />
        <StatCard
          title="False Positives"
          value={stats?.confusionMatrix?.falsePositive?.toLocaleString() || 0}
          icon={AlertCircle}
          color="bg-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Dataset Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Performance</span>
              <span className="text-white font-mono">{stats?.performanceRecords?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Syntax Errors</span>
              <span className="text-white font-mono">{stats?.syntaxRecords?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Logic Errors</span>
              <span className="text-white font-mono">{stats?.logicRecords?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Unknown</span>
              <span className="text-white font-mono">{stats?.unknownRecords?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Confusion Matrix</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-900/30 border border-emerald-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {stats?.confusionMatrix?.truePositive || 0}
              </div>
              <div className="text-sm text-emerald-300">True Positive</div>
            </div>
            <div className="bg-orange-900/30 border border-orange-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">
                {stats?.confusionMatrix?.falsePositive || 0}
              </div>
              <div className="text-sm text-orange-300">False Positive</div>
            </div>
            <div className="bg-emerald-900/30 border border-emerald-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {stats?.confusionMatrix?.trueNegative || 0}
              </div>
              <div className="text-sm text-emerald-300">True Negative</div>
            </div>
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">
                {stats?.confusionMatrix?.falseNegative || 0}
              </div>
              <div className="text-sm text-red-300">False Negative</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
