export interface QueryLog {
  id: string;
  originalQuery: string;
  optimizedQuery?: string | null;
  executionTime?: number | null;
  isSlow: boolean;
  explanation?: string | null;
  explainPlan?: any;
  createdAt: string;
}

export type CreateQueryLogInput = Omit<QueryLog, 'id' | 'createdAt'>;
