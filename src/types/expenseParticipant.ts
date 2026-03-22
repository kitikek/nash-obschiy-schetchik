// expenseParticipant.ts

/**
 * Участник конкретного расхода (связь многие-ко-многим).
 * Таблица "Участник расхода".
 */
export interface ExpenseParticipant {
  id: string;
  expenseId: string;
  userId: string;
  debt: number;
  isPayer: boolean;
  paid: boolean;             // Подтверждено плательщиком
  paymentRequested: boolean;  // Должник запросил подтверждение
}

/**
 * Данные для добавления участника к расходу (обычно используется внутри CreateExpenseData).
 */
export interface ExpenseParticipantData {
  userId: string;
  debt?: number;             // Если нужно явно указать долг (при неравномерном распределении)
  isPayer: boolean;
}