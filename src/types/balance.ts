// balance.ts

/**
 * Итоговый баланс (долг) между двумя участниками группы.
 * Таблица "Баланс".
 */
export interface Balance {
  id: number;                // ID баланса (счетчик)
  groupId: number;           // ID группы
  creditorId: number;        // ID пользователя-кредитора (кому должны)
  debtorId: number;          // ID пользователя-должника (кто должен)
  amount: number;            // Сумма долга (вещественное)
  paidAmount: number;        // Оплаченная сумма (вещественное, по умолчанию 0)
  lastUpdated: string;       // Последнее обновление (ISO)
}

/**
 * Упрощённое представление долга для отображения на UI.
 * Может содержать имена вместо id.
 */
export interface BalanceView {
  creditorId: number;
  creditorName: string;
  debtorId: number;
  debtorName: string;
  amount: number;
  paidAmount: number;
  remaining: number;         // amount - paidAmount
}

/**
 * Данные для отметки о частичном погашении долга.
 */
export interface PayBalanceData {
  balanceId: number;
  amount: number;            // Сумма, которую платят
  paidBy: number;            // ID должника (кто платит)
  paidTo: number;            // ID кредитора (кому платят)
}