import { api } from './api';
import type { User } from '../types/user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// === Авторизация ===
export const login = async ({ email, password }: LoginCredentials): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const { data: response } = await api.post<AuthResponse>('/auth/register', data);
  return response;
};

// === Восстановление пароля ===
export const requestPasswordReset = async (email: string): Promise<void> => {
  await api.post('/auth/forgot-password', { email });
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await api.post('/auth/reset-password', { token, newPassword });
};