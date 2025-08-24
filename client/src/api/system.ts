import api from './api';

export interface SystemStatus {
  overall: 'healthy' | 'warning' | 'error';
  database: boolean;
  ollama: boolean;
  details: {
    database: {
      healthy: boolean;
      latency: number | null;
      error: string | null;
    };
    ollama: {
      healthy: boolean;
      latency: number | null;
      error: string | null;
      models?: number;
      warning?: string;
    };
    environment: {
      nodeEnv: string;
      dockerized: boolean;
      ollamaUrl: string;
    };
  };
  timestamp: string;
}

// Description: Get system status including database and Ollama health
// Endpoint: GET /api/system/status
// Request: {}
// Response: SystemStatus
export const getSystemStatus = async (): Promise<SystemStatus> => {
  try {
    const response = await api.get('/api/system/status');
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};