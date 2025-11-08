import axios from 'axios';

// @ts-ignore - Vite env type
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// If we're in the browser accessing from localhost:3000,
// replace the Docker container name with localhost
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  API_BASE_URL = 'http://localhost:8001';
}

console.log('API_BASE_URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export interface MessageRequest {
  text: string;
  user_id?: string;
}

export interface MessageResponse {
  id: string;
  user_message: string;
  ai_response: string;
  model: string;
}

export const sendMessage = async (message: MessageRequest): Promise<MessageResponse> => {
  const response = await apiClient.post('/api/chat', message);
  return response.data;
};

export const getMessages = async (userId?: string, limit?: number) => {
  const response = await apiClient.get('/api/messages', {
    params: {
      user_id: userId,
      limit: limit || 50,
    },
  });
  return response.data;
};

export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const getProducts = async (page = 1, limit = 20, q?: string) => {
  const response = await apiClient.get('/api/products/', {
    params: {
      page,
      limit,
      q,
    },
  });
  return response.data;
};

export const getProduct = async (id: string) => {
  const response = await apiClient.get(`/api/products/${encodeURIComponent(id)}`);
  return response.data;
};

export default apiClient;
