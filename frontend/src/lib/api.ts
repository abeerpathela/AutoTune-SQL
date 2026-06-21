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
  Course,
  Chapter,
  Quiz,
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

  // Academy endpoints (v1)
  async getCourses(): Promise<Course[]> {
    const response = await apiClient.get('/v1/academy/courses');
    return response.data;
  },
  async getCourseById(id: string): Promise<Course> {
    const response = await apiClient.get(`/v1/academy/courses/${id}`);
    return response.data;
  },
  async createCourse(data: { title: string; description?: string }): Promise<Course> {
    const response = await apiClient.post('/v1/academy/courses', data);
    return response.data;
  },
  async updateCourse(id: string, data: Partial<Course>): Promise<Course> {
    const response = await apiClient.put(`/v1/academy/courses/${id}`, data);
    return response.data;
  },
  async deleteCourse(id: string): Promise<void> {
    await apiClient.delete(`/v1/academy/courses/${id}`);
  },

  async getChapterById(id: string): Promise<Chapter> {
    const response = await apiClient.get(`/v1/academy/chapters/${id}`);
    return response.data;
  },
  async createChapter(courseId: string, data: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chapter> {
    const response = await apiClient.post(`/v1/academy/courses/${courseId}/chapters`, data);
    return response.data;
  },
  async updateChapter(id: string, data: Partial<Chapter>): Promise<Chapter> {
    const response = await apiClient.put(`/v1/academy/chapters/${id}`, data);
    return response.data;
  },
  async deleteChapter(id: string): Promise<void> {
    await apiClient.delete(`/v1/academy/chapters/${id}`);
  },

  async createQuiz(chapterId: string, data: { questions: any }): Promise<Quiz> {
    const response = await apiClient.post(`/v1/academy/chapters/${chapterId}/quizzes`, data);
    return response.data;
  },
  async updateQuiz(id: string, data: { questions: any }): Promise<Quiz> {
    const response = await apiClient.put(`/v1/academy/quizzes/${id}`, data);
    return response.data;
  },
  async deleteQuiz(id: string): Promise<void> {
    await apiClient.delete(`/v1/academy/quizzes/${id}`);
  },

  async getProgress(): Promise<{ percentage: number; completed: number; total: number }> {
    const response = await apiClient.get('/v1/academy/progress');
    return response.data;
  },
  async getProgressDetails(): Promise<UserProgress[]> {
    const response = await apiClient.get('/v1/academy/progress/details');
    return response.data;
  },
  async updateProgress(chapterId: string, status: 'IN_PROGRESS' | 'COMPLETED'): Promise<UserProgress> {
    const response = await apiClient.post(`/v1/academy/progress/${chapterId}`, { status });
    return response.data;
  },

  async evaluateQuiz(quizId: string, answers: any[]): Promise<{ score: number; correct: number; total: number }> {
    const response = await apiClient.post(`/v1/academy/quizzes/${quizId}/evaluate`, { answers });
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
};
