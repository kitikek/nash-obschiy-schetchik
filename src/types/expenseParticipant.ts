// expenseParticipant.ts

/**
 * Участник конкретного расхода (связь многие-ко-многим).
 * Таблица "Участник расхода".
 */
export interface ExpenseParticipant {
  id: number;
  expenseId: number;
  userId: number;
  shareAmount: number;
  isPayer: boolean;
}

/**
 * Данные для добавления участника к расходу (обычно используется внутри CreateExpenseData).
 */
export interface ExpenseParticipantData {
  userId: number;
  shareAmount: number;
  isPayer: boolean;
}