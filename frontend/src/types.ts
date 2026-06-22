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
  firstTimeLogin?: boolean;
  isNewUser?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
}

export type ChapterType = 'VIDEO' | 'THEORY';

export interface ChapterProgressState {
  videoWatched: boolean;
  videoWatchPercent?: number;
  videoCompleted: boolean;
  quizScore: number | null;
  quizAttempts: number;
  focusViolations: number;
  isCompleted: boolean;
  isUnlocked: boolean;
}

export type ChapterAccessState = 'Locked' | 'Unlocked' | 'Completed';

export interface ChapterStatus {
  state: ChapterAccessState;
  isCompleted: boolean;
  isUnlocked: boolean;
  videoWatched: boolean;
  videoWatchPercent?: number;
  videoCompleted: boolean;
  quizScore: number | null;
  quizAttempts: number;
  focusViolations: number;
}

export interface Chapter {
  id: string;
  title: string;
  type: ChapterType;
  videoUrl?: string | null;
  theoryContent?: string;
  order: number;
  globalOrder?: number;
  courseId: string;
  moduleTitle?: string;
  quiz?: { questions: QuizQuestion[] };
  quizQuestionCount?: number;
  status?: ChapterStatus;
  isCompleted?: boolean;
  progress?: ChapterProgressState;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademyCatalogResponse {
  chapters: Chapter[];
  resumeOrder: number;
  userId: string;
  totalProgress?: number;
  completedCount?: number;
  totalChapters?: number;
}

export interface ChapterContent {
  id: string;
  type: ChapterType;
  globalOrder: number;
  videoUrl?: string | null;
  theoryContent: string;
  quiz: { questions: QuizQuestion[] };
  practiceLab?: PracticeLabSpec | null;
  status?: ChapterStatus;
  isCompleted?: boolean;
  progress?: ChapterProgressState;
}

export interface PracticeLabSpec {
  practiceQuery: string;
  expectedResult: {
    columns: string[];
    rowCount?: number;
    minRows?: number;
  };
}

export interface QueryResultRows {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  id: string;
  chapterId: string;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface AcademyProgress {
  percentage: number;
  completed: number;
  total: number;
  remainingChapters?: { id: string; title: string; globalOrder: number }[];
}

export interface ProgressMasterState {
  success?: boolean;
  completedCount: number;
  progressPercent: number;
  updatedChapterId?: string;
  completedChapterIds?: string[];
  totalChapters?: number;
  nextChapterId?: string | null;
}

export interface UserProgress {
  id: string;
  userId: string;
  chapterId: string;
  videoWatched: boolean;
  videoWatchPercent?: number;
  videoCompleted: boolean;
  quizScore?: number | null;
  quizAttempts: number;
  focusViolations: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizReviewItem {
  question: string;
  options: string[];
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
}

export interface QuizSubmitResult {
  passed: boolean;
  score: number;
  correctCount?: number;
  totalCount?: number;
  review?: QuizReviewItem[];
  nextChapterId: string | null;
  reason?: string;
  progress: ChapterProgressState;
  success?: boolean;
  completedCount?: number;
  progressPercent?: number;
  updatedChapterId?: string;
  completedChapterIds?: string[];
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

// Legacy optimizer types
export interface QueryAnalysisError {
  errorCategory: string;
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
  explainPlan?: unknown;
  createdAt: string;
  isSyntaxValid?: boolean;
  errorCategory?: string;
  postgresError?: string;
  joinTypeCount: number;
  logicFlaws?: unknown;
  explanation?: string;
  connectionId?: string;
  userId?: string;
}

export interface DatasetStats {
  totalQueries: number;
  avgExecutionTime: number;
  totalQueriesByCategory: { [key: string]: number };
}

export interface ConfusionMatrix {
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
}

export interface TrainingStats {
  accuracy?: number;
  recordCount?: number;
  performanceRecords?: number;
  syntaxRecords?: number;
  logicRecords?: number;
  unknownRecords?: number;
  confusionMatrix?: ConfusionMatrix;
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
  analysis?: Record<string, unknown> & {
    resultRows?: QueryResultRows;
  };
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
