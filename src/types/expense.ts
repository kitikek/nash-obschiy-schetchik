// expense.ts

import type { ExpenseParticipant } from './expenseParticipant';

/**
 * Расход (трата) внутри группы.
 * Таблица "Расход".
 */
export interface Expense {
  id: number;                // ID расхода (счетчик)
  groupId: number;           // ID группы, к которой относится расход
  description: string;       // Описание расхода (до 255 символов)
  amount: number;            // Общая сумма (вещественное, точность до копеек)
  date: string;              // Дата расхода (ISO)
  createdBy: number;         // ID создателя расхода (пользователь)
  createdAt: string;         // Время создания (ISO)
  isDeleted: boolean;        // Метка удаления (логический)
  // Может включать детальную информацию об участниках, если API её подгружает
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