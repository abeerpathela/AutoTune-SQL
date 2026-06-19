import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'sonner';
import type { QueryLog, DatasetStats, TrainingStats, AnalysisResult, OptimizationResult, DbConnection } from '../types.js';

const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    toast.error(errorMessage);
    return Promise.reject(error);
  }
);

export const api = {
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
    const response = await apiClient.post('/queries/analyze', { sql, connectionId });
    return response.data;
  },
  async optimizeQuery(id: string): Promise<OptimizationResult> {
    const response = await apiClient.post(`/optimize/${id}`);
    return response.data;
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
  }
};
