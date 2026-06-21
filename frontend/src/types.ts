export interface QueryAnalysisError {
  errorCategory: 'Schema' | 'Syntax' | 'Connection' | 'Validation' | 'Logic' | 'Performance' | string;
  message: string;
  code?: string;
  hint?: string;
}

export interface QueryLog {
  id: string;
  originalQuery: string;
  optimizedQuery?: string;
  executionTime?: number;
  isSlow: boolean;
  explainPlan?: any;
  createdAt: string;
  isSyntaxValid?: boolean;
  errorCategory?: string;
  postgresError?: string;
  joinTypeCount: number;
  logicFlaws?: any;
  explanation?: string;
  connectionId?: string;
  userId?: string;
}

export interface DatasetStats {
  totalQueries: number;
  avgExecutionTime: number;
  totalQueriesByCategory: { [key: string]: number };
}

export interface TrainingStats {
  accuracy?: number;
  recordCount?: number;
  performanceRecords?: number;
  syntaxRecords?: number;
  logicRecords?: number;
  unknownRecords?: number;
  confusionMatrix?: any;
  success: boolean;
  message?: string;
}

export interface AnalysisResult {
  id: string;
  queryLog: QueryLog;
  mlPrediction: {
    prediction: string;
    probability: number;
    advice?: string;
  };
  executionTime?: number;
  isSlow?: boolean;
  analysis?: Record<string, unknown>;
}

export interface OptimizationResult {
  originalQuery: string;
  optimizedQuery: string;
  explanation: string;
  executionTimeImprovement?: number;
}

export interface DbConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  createdAt: string;
  userId?: string;
}

// New types for academy
export interface User {
  id: string;
  email: string;
  password?: string;
  githubId?: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
  isVerified: boolean;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  courseId: string;
  quiz?: Quiz;
  progress?: UserProgress[];
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  chapterId: string;
  questions: any;
  createdAt: string;
  updatedAt: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  chapterId: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  certificateId: string;
  userId: string;
  type: string;
  issueDate: string;
  verificationLink: string;
  createdAt: string;
}
