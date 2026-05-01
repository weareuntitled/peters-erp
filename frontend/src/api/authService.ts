import apiClient from './apiClient';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
  };
}

export const authService = {
  async login(credentials: LoginCredentials) {
    // OAuth2PasswordRequestForm expects form-encoded data
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await apiClient.post<LoginResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  async logout() {
    return true;
  },
};

export default authService;