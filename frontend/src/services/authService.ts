import axios from 'axios';
import apiClient from './api';

// Bypasses apiClient on purpose: the password-change token must not be swapped
// for the stored access token, and a 401 must not trigger a refresh.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
import { AuthResponse, LoginCredentials, PasswordChangeRequired, RegisterCredentials, User } from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse | PasswordChangeRequired> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  loginWithGoogle: async (credential: string): Promise<AuthResponse | PasswordChangeRequired> => {
    const response = await apiClient.post('/auth/google', { credential });
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', credentials);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  /** Exchanges the short-lived password-change token and a new password for a session. */
  completePasswordChange: async (passwordChangeToken: string, newPassword: string): Promise<AuthResponse> => {
    const response = await axios.post(`${API_BASE_URL}/auth/complete-password-change`, { newPassword }, {
      headers: { Authorization: `Bearer ${passwordChangeToken}` },
      timeout: 10000,
    });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

};