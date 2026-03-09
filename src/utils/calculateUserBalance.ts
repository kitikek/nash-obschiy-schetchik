// src/utils/calculateUserBalance.ts
import type { Group } from '../types/group';
import type { Expense } from '../types/expense';

export function calculateUserBalance(group: Group, userId: number): number {
  if (!group.expenses) return 0;
  let balance = 0;
  group.expenses.forEach((exp: { participants: any[]; amount: number; }) => {
    const participant = exp.participants.find(p => p.userId === userId);
    if (!participant) return;
    // Если участник платил, ему должны (сумма расхода - его доля) 
    // Или он должен другим, если не платил (его доля)
    if (participant.isPayer) {
      balance += exp.amount - participant.debt; // ему должны
    } else {
      balance -= participant.debt; // он должен
    }
  });
  return balance;
}