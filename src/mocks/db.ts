// src/mocks/db.ts
import type { User } from '../types/user';
import type { Group } from '../types/group';
import type { GroupMember } from '../types/groupMember';
import type { Expense } from '../types/expense';
import type { ExpenseParticipant } from '../types/expenseParticipant';
import type { Balance } from '../types/balance';

// Пользователи для аутентификации (с паролями)
export const authUsers = [
  { userId: 1, email: 'anna@example.com', password: '123456' },
  { userId: 2, email: 'ivan@example.com', password: '123456' },
  { userId: 3, email: 'maria@example.com', password: '123456' },
  { userId: 3, email: 'katamelnik159@gmail.com', password: '123456' },
];

// Пользователи (соответствуют интерфейсу User)
export const users: User[] = [
  {
    id: 1,
    name: 'Анна',
    email: 'anna@example.com',
    phone: '+79991234567',
    registrationDate: '2024-01-01',
    lastLogin: '2024-03-10T10:00:00',
  },
  {
    id: 2,
    name: 'Иван',
    email: 'ivan@example.com',
    phone: '+79997654321',
    registrationDate: '2024-01-15',
    lastLogin: '2024-03-09T15:30:00',
  },
  {
    id: 3,
    name: 'Мария',
    email: 'maria@example.com',
    phone: '+79995551234',
    registrationDate: '2024-02-01',
    lastLogin: '2024-03-10T09:15:00',
  },
];

// Группы (добавлено поле updatedAt для сортировки)
export const groups: Group[] = [
  { id: 1, name: 'Поездка на море', description: 'Собираем на бензин', authorId: 1, createdAt: '2024-01-10', updatedAt: '2024-03-12', status: true, currency: 'RUB' },
  { id: 2, name: 'Квартира', description: 'Коммуналка и продукты', authorId: 2, createdAt: '2024-02-15', updatedAt: '2024-03-11', status: true, currency: 'RUB' },
  { id: 3, name: 'День рождения', description: 'Подарок другу', authorId: 3, createdAt: '2024-03-01', updatedAt: '2024-03-10', status: true, currency: 'RUB' },
  { id: 4, name: '8 марта', description: '', authorId: 1, createdAt: '2024-04-10', updatedAt: '2024-04-10', status: true, currency: 'RUB' },
  { id: 5, name: 'Лёха привет', description: 'Колбаса, мазик, бутер', authorId: 2, createdAt: '2024-01-15', updatedAt: '2024-03-09', status: true, currency: 'RUB' },
  { id: 6, name: 'Ветеринар', description: 'Прививки годовые', authorId: 3, createdAt: '2024-03-06', updatedAt: '2024-03-06', status: true, currency: 'RUB' },
];

// Участники групп (связь многие-ко-многим)
export const groupMembers: GroupMember[] = [
  { id: 1, userId: 1, groupId: 1, joinedAt: '2024-01-10', isAdmin: true },
  { id: 2, userId: 2, groupId: 1, joinedAt: '2024-01-11', isAdmin: false },
  { id: 3, userId: 3, groupId: 1, joinedAt: '2024-01-12', isAdmin: false },
  { id: 4, userId: 1, groupId: 2, joinedAt: '2024-02-15', isAdmin: false },
  { id: 5, userId: 2, groupId: 2, joinedAt: '2024-02-15', isAdmin: true },
  { id: 6, userId: 3, groupId: 2, joinedAt: '2024-02-16', isAdmin: false },
  { id: 7, userId: 3, groupId: 3, joinedAt: '2024-03-01', isAdmin: true },
  { id: 8, userId: 1, groupId: 3, joinedAt: '2024-03-02', isAdmin: false },
  { id: 9, userId: 2, groupId: 3, joinedAt: '2024-03-02', isAdmin: false },
];

// Расходы (таблица Expense)
export const expenses: Expense[] = [
  {
    id: 1,
    groupId: 1,
    description: 'Дорога (бензин)',
    amount: 3000,
    date: '2024-03-10',
    createdBy: 1,
    createdAt: '2024-03-10T12:00:00',
    isDeleted: false,
    participants: [], // заполним ниже
  },
  {
    id: 2,
    groupId: 1,
    description: 'Продукты',
    amount: 2000,
    date: '2024-03-11',
    createdBy: 2,
    createdAt: '2024-03-11T09:00:00',
    isDeleted: false,
    participants: [],
  },
  {
    id: 3,
    groupId: 2,
    description: 'Коммуналка',
    amount: 4500,
    date: '2024-03-05',
    createdBy: 2,
    createdAt: '2024-03-05T14:00:00',
    isDeleted: false,
    participants: [],
  },
  {
    id: 4,
    groupId: 2,
    description: 'Клининг',
    amount: 1500,
    date: '2024-03-07',
    createdBy: 1,
    createdAt: '2024-03-07T10:00:00',
    isDeleted: false,
    participants: [],
  },
  {
    id: 5,
    groupId: 3,
    description: 'Подарок',
    amount: 3000,
    date: '2024-03-01',
    createdBy: 3,
    createdAt: '2024-03-01T18:00:00',
    isDeleted: false,
    participants: [],
  },
  {
    id: 6,
    groupId: 3,
    description: 'Торт',
    amount: 800,
    date: '2024-03-01',
    createdBy: 3,
    createdAt: '2024-03-01T17:00:00',
    isDeleted: false,
    participants: [],
  },
];

// Участники расходов (ExpenseParticipant) с добавленным полем paid
export const expenseParticipants: ExpenseParticipant[] = [
  // Для expense 1
  { id: 1, expenseId: 1, userId: 1, debt: 1000, isPayer: true, paid: true, paymentRequested: false },
  { id: 2, expenseId: 1, userId: 2, debt: 1000, isPayer: false, paid: false, paymentRequested: false },
  { id: 3, expenseId: 1, userId: 3, debt: 1000, isPayer: false, paid: false, paymentRequested: false },
  // Для expense 2
  { id: 4, expenseId: 2, userId: 2, debt: 666.67, isPayer: true, paid: true, paymentRequested: false },
  { id: 5, expenseId: 2, userId: 1, debt: 666.67, isPayer: false, paid: false, paymentRequested: false },
  { id: 6, expenseId: 2, userId: 3, debt: 666.67, isPayer: false, paid: false, paymentRequested: false },
  // Для expense 3
  { id: 7, expenseId: 3, userId: 2, debt: 1500, isPayer: true, paid: true, paymentRequested: false },
  { id: 8, expenseId: 3, userId: 1, debt: 1500, isPayer: false, paid: false, paymentRequested: false },
  { id: 9, expenseId: 3, userId: 3, debt: 1500, isPayer: false, paid: false, paymentRequested: false },
  // Для expense 4
  { id: 10, expenseId: 4, userId: 1, debt: 500, isPayer: true, paid: true, paymentRequested: false },
  { id: 11, expenseId: 4, userId: 2, debt: 500, isPayer: false, paid: false, paymentRequested: false },
  { id: 12, expenseId: 4, userId: 3, debt: 500, isPayer: false, paid: false, paymentRequested: false },
  // Для expense 5
  { id: 13, expenseId: 5, userId: 3, debt: 1000, isPayer: true, paid: true, paymentRequested: false },
  { id: 14, expenseId: 5, userId: 1, debt: 1000, isPayer: false, paid: false, paymentRequested: false },
  { id: 15, expenseId: 5, userId: 2, debt: 1000, isPayer: false, paid: false, paymentRequested: false },
  // Для expense 6
  { id: 16, expenseId: 6, userId: 3, debt: 266.67, isPayer: true, paid: true, paymentRequested: false },
  { id: 17, expenseId: 6, userId: 1, debt: 266.67, isPayer: false, paid: false, paymentRequested: false },
  { id: 18, expenseId: 6, userId: 2, debt: 266.67, isPayer: false, paid: false, paymentRequested: false },
];

// Связываем расходы с их участниками
expenses.forEach(exp => {
  exp.participants = expenseParticipants.filter(p => p.expenseId === exp.id);
});

// Балансы (можно оставить пустыми для моков)
export const balances: Balance[] = [];

export const resetTokens: { token: string; email: string; expiresAt: Date }[] = [];

expenses.forEach(exp => {
  if (!exp.updatedAt) {
    exp.updatedAt = exp.createdAt;
    exp.updatedBy = exp.createdBy;
  }
});