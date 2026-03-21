// src/services/auth.ts
import emailjs from '@emailjs/browser';
import { authUsers, users, resetTokens } from '../mocks/db';
import type { User } from '../types/user';

const delay = (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms));

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

// Конфигурация EmailJS (замените на свои данные)
const EMAILJS_SERVICE_ID = 'service_5tqcfke';      // ваш Service ID
const EMAILJS_TEMPLATE_ID = 'template_lgu4icf';        // ваш Template ID
const EMAILJS_PUBLIC_KEY = 'jColqzIO-KidiAxaB';       // ваш Public Key

// Инициализация EmailJS (выполнить один раз)
emailjs.init(EMAILJS_PUBLIC_KEY);

// Функция отправки письма
const sendPasswordResetEmail = async (toEmail: string, resetLink: string): Promise<void> => {
  const templateParams = {
    link: resetLink,
    email: toEmail,
  };
  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    console.log('Email sent successfully');
  } catch (error) {
    console.error('EmailJS error:', error);
    throw new Error('Не удалось отправить письмо. Попробуйте позже.');
  }
};

// Функция запроса сброса пароля
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; link?: string }> => {
  // Имитация задержки
  await new Promise(resolve => setTimeout(resolve, 300));

  const authUser = authUsers.find(u => u.email === email);
  if (!authUser) {
    throw new Error('Пользователь с таким email не найден');
  }

  // Генерация токена
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date(Date.now() + 3600000); // 1 час
  resetTokens.push({ token, email, expiresAt });
  console.log('Токен сохранён:', { token, email, expiresAt });

  const resetLink = `${window.location.origin}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(email, resetLink);
    return { success: true, link: resetLink };
  } catch (error) {
    // Если отправка не удалась, возвращаем ссылку для отладки (в консоль)
    console.log('Ссылка для отладки:', resetLink);
    return { success: true, link: resetLink };
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await delay();
  const resetRecord = resetTokens.find(rt => rt.token === token);
  if (!resetRecord) {
    throw new Error('Недействительный или истёкший токен');
  }
  if (new Date() > resetRecord.expiresAt) {
    throw new Error('Срок действия ссылки истёк. Запросите сброс пароля заново.');
  }
  const authUser = authUsers.find(u => u.email === resetRecord.email);
  if (!authUser) {
    throw new Error('Пользователь не найден');
  }
  authUser.password = newPassword;
  // Удаляем использованный токен
  const index = resetTokens.findIndex(rt => rt.token === token);
  if (index !== -1) resetTokens.splice(index, 1);
};