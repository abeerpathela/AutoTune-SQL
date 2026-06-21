import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { config } from './config';
import type {
  QueryLog,
  DatasetStats,
  TrainingStats,
  AnalysisResult,
  OptimizationResult,
  DbConnection,
  User,
  Chapter,
  UserProgress,
  Certificate,
  QueryAnalysisError,
} from '../types';

const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    toast.error(errorMessage);
    return Promise.reject(error);
  }
);

export const api = {
  // Legacy API endpoints
  async getDatasetStats(): Promise<DatasetStats> {
    const response = await apiClient.get('/ml/dataset-stats');
    return response.data.data;
  },
  async getTrainingStats(): Promise<TrainingStats> {
    const response = await apiClient.get('/ml/stats');
    return response.data.data;
  },
  async trainModel(): Promise<TrainingStats> {
    const response = await apiClient.post('/ml/train');
    return response.data.data;
  },
  async analyzeQuery(sql: string, connectionId?: string): Promise<AnalysisResult> {
    const response = await apiClient.post('/v1/queries/analyze', { sql, connectionId });
    return response.data.data;
  },
  async analyzeQueryOrThrow(
    sql: string,
    connectionId?: string
  ): Promise<AnalysisResult> {
    try {
      const response = await apiClient.post('/v1/queries/analyze', { sql, connectionId });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: {
          data?: QueryAnalysisError & { data?: AnalysisResult };
        };
      };
      const payload = axiosError.response?.data;
      if (payload?.errorCategory && payload?.message) {
        const structured: QueryAnalysisError & { partial?: AnalysisResult } = {
          errorCategory: payload.errorCategory,
          message: payload.message,
          code: payload.code,
          hint: payload.hint,
          partial: payload.data,
        };
        throw structured;
      }
      throw error;
    }
  },
  async optimizeQuery(id: string): Promise<OptimizationResult> {
    const response = await apiClient.post(`/optimize/${id}`);
    return response.data.data;
  },
  async getQueryHistory(): Promise<QueryLog[]> {
    const response = await apiClient.get('/queries/history');
    return response.data.data;
  },
  async getConnections(): Promise<DbConnection[]> {
    const response = await apiClient.get('/connections');
    return response.data.data;
  },
  async createConnection(connection: Omit<DbConnection, 'id' | 'createdAt'>): Promise<DbConnection> {
    const response = await apiClient.post('/connections', connection);
    return response.data.data;
  },
  async deleteConnection(id: string): Promise<void> {
    await apiClient.delete(`/connections/${id}`);
  },
  async testConnection(connection: Omit<DbConnection, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.post('/connections/test', connection);
    return response.data.data;
  },

  // Auth endpoints (v1)
  async signup(data: { email: string; password: string; firstName?: string; lastName?: string }): Promise<{ token: string; user: User }> {
    const response = await apiClient.post('/v1/auth/signup', data);
    if (response.data.token) localStorage.setItem('token', response.data.token);
    return response.data;
  },
  async login(data: { email: string; password: string }): Promise<{ token: string; user: User }> {
    const response = await apiClient.post('/v1/auth/login', data);
    if (response.data.token) localStorage.setItem('token', response.data.token);
    return response.data;
  },
  async getMe(): Promise<User> {
    const response = await apiClient.get('/v1/auth/me');
    return response.data;
  },
  logout() {
    localStorage.removeItem('token');
  },

  // Academy LMS endpoints (v1)
  _catalogCache: null as import('../types').AcademyCatalogResponse | null,

  invalidateAcademyCatalog() {
    this._catalogCache = null;
  },

  async getAcademyCatalog(force = false): Promise<import('../types').AcademyCatalogResponse> {
    if (this._catalogCache && !force) return this._catalogCache;
    const response = await apiClient.get('/v1/academy/catalog');
    this._catalogCache = response.data;
    return response.data;
  },

  /** Optimistically mark a chapter complete in the in-memory catalog cache. */
  optimisticCompleteChapter(chapterId: string) {
    if (!this._catalogCache) return;
    const wasComplete = this._catalogCache.chapters.find((c) => c.id === chapterId)?.isCompleted;
    this._catalogCache = {
      ...this._catalogCache,
      chapters: this._catalogCache.chapters.map((ch) =>
        ch.id === chapterId
          ? {
              ...ch,
              isCompleted: true,
              status: ch.status
                ? { ...ch.status, isCompleted: true, state: 'Completed' as const }
                : ch.status,
              progress: ch.progress
                ? { ...ch.progress, isCompleted: true, videoCompleted: true, videoWatched: true }
                : ch.progress,
            }
          : ch
      ),
      completedCount: wasComplete
        ? this._catalogCache.completedCount
        : (this._catalogCache.completedCount ?? 0) + 1,
    };
  },

  async getChapterContent(chapterId: string): Promise<import('../types').ChapterContent> {
    const response = await apiClient.get(`/v1/academy/chapters/${chapterId}/content`);
    return response.data;
  },
  async getChapterByOrder(order: number): Promise<Chapter> {
    const response = await apiClient.get(`/v1/academy/chapters/by-order/${order}`);
    return response.data;
  },
  async getProgress(): Promise<import('../types').AcademyProgress> {
    const response = await apiClient.get('/v1/academy/progress');
    return response.data;
  },
  async getProgressSummary(): Promise<import('../types').ProgressMasterState> {
    const response = await apiClient.get('/v1/academy/progress/summary');
    return response.data;
  },
  async updateChapterProgress(
    chapterId: string,
    payload: {
      isCompleted?: boolean;
      videoWatched?: boolean;
      videoCompleted?: boolean;
      videoWatchPercent?: number;
      quizScore?: number;
    }
  ): Promise<import('../types').ProgressMasterState & { progress: import('../types').ChapterProgressState }> {
    const response = await apiClient.patch(`/v1/academy/chapters/${chapterId}/progress`, payload);
    return response.data;
  },
  async getProgressDetails(): Promise<UserProgress[]> {
    const response = await apiClient.get('/v1/academy/progress/details');
    return response.data;
  },
  async completeVideo(
    chapterId: string,
    videoId: string,
    maxWatchPercent: number
  ): Promise<
    import('../types').ProgressMasterState & {
      progress: import('../types').ChapterProgressState;
      nextChapterId: string | null;
    }
  > {
    const response = await apiClient.post(`/v1/academy/chapters/${chapterId}/complete-video`, {
      videoId,
      maxWatchPercent,
    });
    return response.data;
  },
  async markVideoWatched(
    chapterId: string,
    videoId: string,
    maxWatchPercent: number
  ): Promise<{
    progress: import('../types').ChapterProgressState;
  }> {
    const response = await apiClient.post(`/v1/academy/chapters/${chapterId}/video-watched`, {
      videoId,
      maxWatchPercent,
    });
    return response.data;
  },
  async submitChapterQuiz(
    chapterId: string,
    answers: number[]
  ): Promise<import('../types').QuizSubmitResult> {
    const response = await apiClient.post(`/v1/academy/chapters/${chapterId}/submit-quiz`, { answers });
    return response.data;
  },
  async failQuiz(
    chapterId: string,
    reason = 'focus_violation'
  ): Promise<import('../types').QuizSubmitResult> {
    const response = await apiClient.post(`/v1/academy/chapters/${chapterId}/quiz/fail`, { reason });
    return response.data;
  },
  async recordFocusViolation(chapterId: string): Promise<{
    violationCount: number;
    progress: import('../types').ChapterProgressState;
  }> {
    const response = await apiClient.post(`/v1/academy/chapters/${chapterId}/quiz/violation`);
    return response.data;
  },

  // Certificate endpoints (v1)
  async generateCertificate(type: string): Promise<Certificate> {
    const response = await apiClient.post('/v1/certificates/generate', { type });
    return response.data;
  },
  async getMyCertificates(): Promise<Certificate[]> {
    const response = await apiClient.get('/v1/certificates/my');
    return response.data;
  },
  async downloadCertificate(id: string): Promise<void> {
    const response = await apiClient.get(`/v1/certificates/download/${id}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'certificate.pdf');
    document.body.appendChild(link);
    link.click();
  },
  async verifyCertificate(certId: string): Promise<{ valid: boolean; certificate?: any }> {
    const response = await apiClient.get(`/v1/certificates/verify/${certId}`);
    return response.data;
  },

  async completeAcademyAdmin(): Promise<{
    completedCount: number;
    totalChapters: number;
    progressPercent: number;
    message: string;
  }> {
    const response = await apiClient.post('/v1/admin/complete-academy');
    return response.data;
  },

  async completeAndCertifyAdmin(type?: string): Promise<{
    completedCount: number;
    totalChapters: number;
    progressPercent: number;
    certificate: Certificate;
    certExisting: boolean;
    message: string;
  }> {
    const response = await apiClient.post('/v1/admin/debug/complete-and-certify', { type });
    return response.data;
  },
};
