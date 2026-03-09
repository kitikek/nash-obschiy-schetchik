// expenseParticipant.ts

/**
 * Участник конкретного расхода (связь многие-ко-многим).
 * Таблица "Участник расхода".
 */
export interface ExpenseParticipant {
  id: number;
  expenseId: number;
  userId: number;
  debt: number;
  isPayer: boolean;
  paid: boolean;             // Подтверждено плательщиком
  paymentRequested: boolean;  // Должник запросил подтверждение
}

/**
 * Данные для добавления участника к расходу (обычно используется внутри CreateExpenseData).
 */
export interface ExpenseParticipantData {
  userId: number;
  debt?: number;             // Если нужно явно указать долг (при неравномерном распределении)
  isPayer: boolean;
}