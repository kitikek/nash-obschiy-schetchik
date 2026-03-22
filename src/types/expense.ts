// expense.ts

import type { ExpenseParticipant } from './expenseParticipant';

/**
 * Расход (трата) внутри группы.
 * Таблица "Расход".
 */
export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  date: string;
  createdBy: string;         // ID создателя
  createdAt: string;         // ISO
  updatedBy?: string;        // ID последнего редактора
  updatedAt?: string;        // ISO
  isDeleted: boolean;
  participants: ExpenseParticipant[];
}

/**
 * Данные для создания нового расхода.
 */
export interface CreateExpenseData {
  groupId: string;
  description: string;
  amount: number;
  date: string;              // или Date, но на практике строка
  payerId: string;           // ID плательщика
  participantIds: string[];  // Список ID участников расхода (включая плательщика)
}

/**
 * Данные для редактирования расхода (частичное обновление).
 */
export interface UpdateExpenseData {
  description?: string;
  amount?: number;
  date?: string;
  payerId?: string;
  participantIds?: string[];
  isDeleted?: boolean;
}
