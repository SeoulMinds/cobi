import axios from 'axios';

// @ts-ignore - Vite env type
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://localhost:${import.meta.env.VITE_BACKEND_PORT || '8000'}`;

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
  products?: Product[];
  search_query?: string;
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

export interface Product {
  id?: string;
  product_id?: string;
  title?: string;
  brand?: string;
  category?: string[];
  price?: number;
  original_price?: number;
  discount_rate?: number;
  currency?: string;
  stock?: number;
  description?: string;
  images?: string[];
  attributes?: Record<string, unknown>;
  tags?: string[];
  ratings?: {
    average?: number;
    count?: number;
  };
  is_soldout?: boolean;
  is_new?: boolean;
  is_best?: boolean;
}

export interface ProductsResponse {
  items: Product[];
  count: number;
  page: number;
  limit: number;
}

export const getProducts = async (page: number = 1, limit: number = 20, query?: string): Promise<ProductsResponse> => {
  const response = await apiClient.get('/api/products/', {
    params: {
      page,
      limit,
      q: query,
    },
  });
  return response.data;
};

export const getProduct = async (id: string) => {
  const response = await apiClient.get(`/api/products/${encodeURIComponent(id)}`);
  return response.data;
};

// User Profile API
export const getUserProfile = async (userId: string) => {
  const response = await apiClient.get(`/api/user-profile/${userId}`);
  return response.data;
};

export const updateUserProfileFromProduct = async (data: {
  user_id: string;
  product_id: string;
  interaction_type: string;
  product_data: Product;
}) => {
  const response = await apiClient.post('/api/user-profile/update-from-product', data);
  return response.data;
};

export const updateUserPreferences = async (data: {
  user_id: string;
  preferences: Record<string, number>;
}) => {
  const response = await apiClient.post('/api/user-profile/update-preferences', data);
  return response.data;
};

export const getPreferenceDimensions = async () => {
  const response = await apiClient.get('/api/user-profile/dimensions');
  return response.data;
};

export default apiClient;
