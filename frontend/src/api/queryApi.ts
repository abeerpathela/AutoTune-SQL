import type { QueryLog } from '../types.js';
import { config } from '../lib/config';

const API_BASE_URL = config.apiBaseUrl;

export interface AnalysisResponse {
  status: string;
  data: {
    queryLog: QueryLog;
    analysis: {
      originalQuery: string;
      explainPlan: any;
      executionTime: number;
      planRows: number;
      actualRows: number;
      startupCost: number;
      totalCost: number;
      nodeType: string;
      hasSequentialScan: boolean;
      roundTripTime: number;
    };
  };
}

export async function analyzeQuery(sql: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/queries/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to analyze query');
  }

  return response.json();
}
