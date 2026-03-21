// expense.ts

import type { ExpenseParticipant } from './expenseParticipant';

/**
 * Расход (трата) внутри группы.
 * Таблица "Расход".
 */
export interface Expense {
  id: number;
  groupId: number;
  description: string;
  amount: number;
  date: string;
  createdBy: number;         // ID создателя
  createdAt: string;         // ISO
  updatedBy?: number;        // ID последнего редактора
  updatedAt?: string;        // ISO
  isDeleted: boolean;
  participants: ExpenseParticipant[];
}

/**
 * Данные для создания нового расхода.
 */
export interface CreateExpenseData {
  groupId: number;
  description: string;
  amount: number;
  date: string;              // или Date, но на практике строка
  payerId: number;           // ID плательщика
  participantIds: number[];  // Список ID участников расхода (включая плательщика)
}

/**
 * Данные для редактирования расхода (частичное обновление).
 */
export interface UpdateExpenseData {
  description?: string;
  amount?: number;
  date?: string;
  payerId?: number;
  participantIds?: number[];
  isDeleted?: boolean;
}
