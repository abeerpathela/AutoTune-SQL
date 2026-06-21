import { useEffect, useState } from 'react';
import { QueryTable } from '../components/QueryTable';
import type { QueryLog } from '../types.js';
import { api } from '../lib/api';

export const History = () => {
  const [queries, setQueries] = useState<QueryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const data = await api.getQueryHistory();
        setQueries(data);
      } catch (err) {
        console.error('Failed to fetch query history:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQueries();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Query History</h1>
        <p className="text-gray-400">Review your latest 50 analyzed queries</p>
      </div>
      <QueryTable queries={queries} loading={loading} />
    </div>
  );
};
