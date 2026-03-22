/**
 * @deprecated Расчёт переводов выполняет бекенд. Используйте `getGroupBalances` из `services/balances`.
 */
import type { Expense } from "../types/expense"
import type { Transfer } from "../types/transfer"

export const calculateBalances = (_expenses: Expense[]): Transfer[] => []
