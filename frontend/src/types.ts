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
    queryLog: QueryLog;
    analysis: any;
    mlPrediction: {
      probability: number;
      prediction: string;
      advice: string;
    };
    mlAdvice: string;
  };
}

export interface OptimizationResult {
  optimizedQuery?: string;
  explanation?: string;
}
