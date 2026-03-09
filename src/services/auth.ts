// src/services/auth.ts
import { authUsers, users } from '../mocks/db';
import type { User } from '../types/user';

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

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

export const login = async ({ email, password }: LoginCredentials): Promise<AuthResponse> => {
  await delay();
  const authUser = authUsers.find(u => u.email === email && u.password === password);
  if (!authUser) {
    throw new Error('Неверный email или пароль');
  }
  const user = users.find(u => u.id === authUser.userId);
  if (!user) throw new Error('Пользователь не найден');
  return {
    token: 'fake-jwt-token-' + user.id,
    user,
  };
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  await delay();
  const existing = authUsers.find(u => u.email === data.email);
  if (existing) {
    throw new Error('Пользователь с таким email уже существует');
  }
  const newUser: User = {
    id: users.length + 1,
    name: data.name,
    email: data.email,
    phone: '',
    registrationDate: new Date().toISOString().split('T')[0],
    lastLogin: new Date().toISOString(),
  };
  users.push(newUser);
  authUsers.push({
    userId: newUser.id,
    email: data.email,
    password: data.password,
  });
  return {
    token: 'fake-jwt-token-' + newUser.id,
    user: newUser,
  };
};