import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

const rawApiBaseUrl = import.meta.env.VITE_API_URL?.trim();

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const upgradeToHttpsIfNeeded = (value: string): string => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && value.startsWith('http://')) {
    return value.replace(/^http:\/\//, 'https://');
  }
  return value;
};

const resolveApiBaseUrl = (): string => {
  if (!rawApiBaseUrl) {
    return '/api';
  }

  const normalized = upgradeToHttpsIfNeeded(rawApiBaseUrl);
  return stripTrailingSlash(normalized);
};

export const API_BASE_URL = resolveApiBaseUrl();

export const getBackendOrigin = (): string => {
  if (isAbsoluteUrl(API_BASE_URL)) {
    return new URL(API_BASE_URL).origin;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
};

export const buildStaticUrl = (path?: string | null): string | null => {
  if (!path) {
    return null;
  }

  const normalizedPath = path.replace('/app/static', '/static');
  const safePath = upgradeToHttpsIfNeeded(normalizedPath);

  if (isAbsoluteUrl(safePath)) {
    return safePath;
  }

  if (safePath.startsWith('/')) {
    return `${getBackendOrigin()}${safePath}`;
  }

  return `${getBackendOrigin()}/${safePath}`;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  maxRedirects: 5,
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const authToken = localStorage.getItem('token');
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
