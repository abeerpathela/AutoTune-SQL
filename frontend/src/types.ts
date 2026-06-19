export interface DbConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  createdAt: string;
}

export interface QueryLog {
  id: string;
  originalQuery: string;
  optimizedQuery?: string | null;
  executionTime?: number | null;
  isSlow: boolean;
  explanation?: string | null;
  explainPlan?: any;
  createdAt: string;
  isSyntaxValid?: boolean | null;
  errorCategory?: string | null;
  logicFlaws?: string[] | null;
  postgresError?: string | null;
  connectionId?: string | null;
  connection?: DbConnection | null;
}

export interface DatasetStats {
  totalQueries: number;
  slowQueries: number;
  fastQueries: number;
  syntaxErrors: number;
  logicErrors: number;
  performanceQueries: number;
  unknownQueries: number;
  averageExecutionTime: number;
  recordsWithExplainPlans: number;
}

export interface TrainingStats {
  success: boolean;
  recordCount: number;
  accuracy: number;
  performanceRecords: number;
  syntaxRecords: number;
  logicRecords: number;
  unknownRecords: number;
  confusionMatrix: {
    truePositive: number;
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
  };
}

export interface AnalysisResult {
  status: string;
  data: {
    id: string;
    mlPrediction: {
      probability: number;
      prediction: string;
      advice: string;
    };
    executionTime?: number | null;
    isSlow: boolean;
    queryLog: QueryLog;
    analysis: any;
  };
}

export interface OptimizationResult {
  status: string;
  data: {
    optimizedQuery?: string;
    explanation?: string;
  };
}
