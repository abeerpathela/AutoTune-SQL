import React from 'react';
import type { QueryLog } from '../types.js';
import { Zap, CheckCircle2, AlertCircle, XCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatusBadge = ({ status }: { status: string }) => {
  const variants = {
    Fast: {
      bg: 'bg-emerald-900/30',
      text: 'text-emerald-400',
      icon: CheckCircle2
    },
    Slow: {
      bg: 'bg-orange-900/30',
      text: 'text-orange-400',
      icon: Zap
    },
    'Syntax Error': {
      bg: 'bg-red-900/30',
      text: 'text-red-400',
      icon: XCircle
    },
    'Logic Error': {
      bg: 'bg-purple-900/30',
      text: 'text-purple-400',
      icon: AlertCircle
    }
  };

  const config = variants[status as keyof typeof variants] || {
    bg: 'bg-gray-800',
    text: 'text-gray-400',
    icon: AlertCircle
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
};

export const QueryTable = ({
  queries,
  loading
}: {
  queries: QueryLog[];
  loading: boolean;
}) => {
  const navigate = useNavigate();

  const getStatus = (q: QueryLog) => {
    if (q.errorCategory === 'Syntax') return 'Syntax Error';
    if (q.errorCategory === 'Logic') return 'Logic Error';
    return q.isSlow ? 'Slow' : 'Fast';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-gray-400 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">SQL Snippet</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Execution Time</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {queries.map((query) => (
              <tr key={query.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-mono text-sm text-gray-300 truncate max-w-md">
                    {query.originalQuery}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={getStatus(query)} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {query.executionTime ? `${query.executionTime.toFixed(2)}ms` : 'N/A'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => navigate('/studio', { state: { sql: query.originalQuery } })}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Optimize
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {queries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No queries yet. Start analyzing in the Optimization Studio!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
