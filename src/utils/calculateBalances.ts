import type { Expense } from "../types/expense"
import type { Transfer } from "../types/transfer"

export const calculateBalances = (expenses: Expense[]): Transfer[] => {
  const balances: Record<number, number> = {}

  expenses.forEach(expense => {
    const participants = expense.participants

    if (!participants.length) return

    const share = Math.round((expense.amount / participants.length) * 100) / 100

    participants.forEach(p => {
      balances[p.userId] = (balances[p.userId] || 0) - share
    })

    const payer = participants.find(p => p.isPayer)

    if (payer) {
      balances[payer.userId] =
        (balances[payer.userId] || 0) + expense.amount
    }
  })

  const creditors: { userId: number; amount: number }[] = []
  const debtors: { userId: number; amount: number }[] = []

  Object.entries(balances).forEach(([userId, balance]) => {
    const id = Number(userId)

    if (balance > 0) creditors.push({ userId: id, amount: balance })
    if (balance < 0) debtors.push({ userId: id, amount: -balance })
  })

  const transfers: Transfer[] = []

  while (creditors.length && debtors.length) {
    const creditor = creditors[0]
    const debtor = debtors[0]

    const amount = Math.min(creditor.amount, debtor.amount)

    transfers.push({
      creditorId: creditor.userId,
      debtorId: debtor.userId,
      amount
    })

    creditor.amount -= amount
    debtor.amount -= amount

    if (creditor.amount === 0) creditors.shift()
    if (debtor.amount === 0) debtors.shift()
  }

  return transfers
}