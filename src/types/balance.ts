// balance.ts

/**
 * Итоговый баланс (долг) между двумя участниками группы.
 * Таблица "Баланс".
 */
export interface Balance {
  id: string;                // ID баланса (xid)
  groupId: string;           // ID группы
  creditorId: string;        // ID пользователя-кредитора (кому должны)
  debtorId: string;          // ID пользователя-должника (кто должен)
  amount: number;            // Сумма долга (вещественное)
  paidAmount: number;        // Оплаченная сумма (вещественное, по умолчанию 0)
  lastUpdated: string;       // Последнее обновление (ISO)
}

/**
 * Упрощённое представление долга для отображения на UI.
 * Может содержать имена вместо id.
 */
export interface BalanceView {
  creditorId: string;
  creditorName: string;
  debtorId: string;
  debtorName: string;
  amount: number;
  paidAmount: number;
  remaining: number;         // amount - paidAmount
}

/**
 * Данные для отметки о частичном погашении долга.
 */
export interface PayBalanceData {
  balanceId: string;
  amount: number;            // Сумма, которую платят
  paidBy: string;            // ID должника (кто платит)
  paidTo: string;            // ID кредитора (кому платят)
}