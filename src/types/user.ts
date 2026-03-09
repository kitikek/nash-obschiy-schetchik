// user.ts

/**
 * Пользователь системы.
 */
export interface User {
  id: number;                // ID пользователя (счетчик)
  name: string;              // Имя пользователя (до 50 символов)
  email: string;             // Почтовый адрес (до 100 символов)
  phone?: string;            // Номер телефона (до 20 символов, необязательно)
  registrationDate: string;  // Дата регистрации (в формате ISO, например "2024-01-15")
  lastLogin?: string;        // Последний вход (метка времени, ISO)
}

/**
 * Данные для регистрации нового пользователя (без id и дат).
 */
export interface CreateUserData {
  name: string;
  email: string;
  password: string;          // пароль (не хранится в модели User, но нужен для регистрации)
  phone?: string;
}

/**
 * Данные для входа.
 */
export interface LoginData {
  email: string;
  password: string;
}