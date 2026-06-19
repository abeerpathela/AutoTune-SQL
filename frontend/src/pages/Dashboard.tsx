import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { DatasetStats, TrainingStats } from '../types.js';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Clock, Target, Brain, Loader2 } from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  trend?: string;
}) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-400 font-medium text-sm">{title}</h3>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="text-3xl font-bold text-white mb-2">{value}</div>
    {trend && <div className="text-green-400 text-sm font-medium">{trend}</div>}
  </div>
);

const mockLatencyData = [
  { time: '00:00', latency: 120 },
  { time: '04:00', latency: 90 },
  { time: '08:00', latency: 200 },
  { time: '12:00', latency: 350 },
  { time: '16:00', latency: 280 },
  { time: '20:00', latency: 150 },
  { time: '24:00', latency: 130 },
];

export const Dashboard = () => {
  const [datasetStats, setDatasetStats] = useState<DatasetStats | null>(null);
  const [trainingStats, setTrainingStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, mlStats] = await Promise.all([
          api.getDatasetStats(),
          api.getTrainingStats()
        ]);
        setDatasetStats(stats);
        setTrainingStats(mlStats);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Overview Dashboard</h1>
        <p className="text-gray-400">Monitor your SQL optimization performance and ML model accuracy</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Queries Analyzed"
          value={datasetStats?.totalQueries.toLocaleString() || 0}
          icon={Target}
          color="bg-blue-600"
        />
        <StatCard
          title="ML Model Accuracy"
          value={trainingStats?.accuracy ? `${trainingStats.accuracy}%` : 'N/A'}
          icon={Brain}
          color="bg-purple-600"
        />
        <StatCard
          title="Avg. Execution Time"
          value={datasetStats?.averageExecutionTime ? `${datasetStats.averageExecutionTime.toFixed(2)}ms` : 'N/A'}
          icon={Clock}
          color="bg-emerald-600"
        />
        <StatCard
          title="Slow Queries"
          value={datasetStats?.slowQueries.toLocaleString() || 0}
          icon={Zap}
          color="bg-orange-600"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Query Latency over Time</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockLatencyData}>
              <defs>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
              />
              <Area
                type="monotone"
                dataKey="latency"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLatency)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
