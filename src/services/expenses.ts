import { expenses, expenseParticipants, groups } from '../mocks/db';
import type { Expense, CreateExpenseData } from '../types/expense';
import type { Balance } from '../types/balance';
import { calculateBalances } from '../utils/calculateBalances';

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export type CreateExpenseInput = Omit<CreateExpenseData, 'groupId'>;
type Transfer = { creditorId: number; debtorId: number; amount: number };
type GroupBalancesResponse = { balances: Balance[]; recommended_transfers: Transfer[] };

let balancesStore: Balance[] = [];

const round2 = (value: number) => Math.round(value * 100) / 100;

const recalculateGroupBalances = (groupId: number): void => {
  const activeExpenses = expenses
    .filter(exp => exp.groupId === groupId && !exp.isDeleted)
    .map(exp => ({
      ...exp,
      participants: expenseParticipants.filter(p => p.expenseId === exp.id),
    }));
  const transfers = calculateBalances(activeExpenses);
  balancesStore = balancesStore.filter(b => b.groupId !== groupId);
  const now = new Date().toISOString();
  const rows: Balance[] = transfers.map((t, idx) => ({
    id: Date.now() + idx,
    groupId,
    creditorId: t.creditorId,
    debtorId: t.debtorId,
    amount: round2(t.amount),
    paidAmount: 0,
    lastUpdated: now,
  }));
  balancesStore.push(...rows);
};

export const getExpensesByGroup = async (groupId: string | number): Promise<Expense[]> => {
  await delay();
  const groupIdNum = typeof groupId === 'string' ? parseInt(groupId, 10) : groupId;
  const group = groups.find(g => g.id === groupIdNum);
  const currency = group?.currency || 'RUB';
  return expenses
    .filter(exp => exp.groupId === groupIdNum && !exp.isDeleted)
    .map(exp => ({
      ...exp,
      participants: expenseParticipants.filter(p => p.expenseId === exp.id),
      currency,
    }));
};

export const createExpense = async (
  groupId: string | number,
  data: Omit<CreateExpenseData, 'groupId'>
): Promise<Expense> => {
  await delay();
  const groupIdNum = typeof groupId === 'string' ? parseInt(groupId, 10) : groupId;
  const newId = expenses.length + 1;
  const participantsPayload = data.participants || [];
  const participants = participantsPayload.map((participant, index) => ({
    id: expenseParticipants.length + index + 1,
    expenseId: newId,
    userId: participant.userId,
    shareAmount: round2(participant.shareAmount),
    isPayer: participant.isPayer,
  }));
  const hasPayer = participants.some(p => p.isPayer);
  if (!hasPayer) throw new Error('Нужен минимум один плательщик');
  if (participants.length < 2) throw new Error('Нужно минимум два участника');
  const payer = participants.find(p => p.isPayer)!;
  const sharesSum = round2(participants.reduce((sum, p) => sum + p.shareAmount, 0));
  if (Math.abs(round2(data.amount) - sharesSum) >= 0.01) {
    throw new Error('Сумма долей участников должна совпадать с суммой расхода');
  }
  const now = new Date().toISOString();
  const newExpense: Expense = {
    id: newId,
    groupId: groupIdNum,
    description: data.description,
    amount: data.amount,
    date: data.date,
    createdBy: payer.userId,
    createdAt: now,
    updatedAt: now,
    updatedBy: payer.userId,
    isDeleted: false,
    participants,
  };
  expenses.push(newExpense);
  expenseParticipants.push(...participants);
  recalculateGroupBalances(groupIdNum);
  return newExpense;
};

export const getUserExpenses = async (userId: number) => {
  await delay();
  const participantExpenseIds = expenseParticipants
    .filter(ep => ep.userId === userId)
    .map(ep => ep.expenseId);
  const userExpenses = expenses.filter(exp => participantExpenseIds.includes(exp.id) && !exp.isDeleted);
  const expensesWithCurrency = userExpenses.map(exp => {
    const group = groups.find(g => g.id === exp.groupId);
    return { ...exp, currency: group?.currency || 'RUB' };
  });
  return expensesWithCurrency.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getExpenseById = async (expenseId: number): Promise<(Expense & { currency: string }) | undefined> => {
  await delay();
  const expense = expenses.find(e => e.id === expenseId);
  if (!expense) return undefined;
  const group = groups.find(g => g.id === expense.groupId);
  const currency = group?.currency || 'RUB';
  return {
    ...expense,
    participants: expenseParticipants.filter(p => p.expenseId === expenseId),
    currency,
  };
};

export const updateExpense = async (
  expenseId: number,
  data: any,
  userId: number
): Promise<Expense> => {
  await delay();
  const index = expenses.findIndex(e => e.id === expenseId);
  if (index === -1) throw new Error('Расход не найден');
  const old = expenses[index];
  if (old.createdBy !== userId) throw new Error('Редактировать расход может только создатель');
  if (data.participants?.length) {
    const participantRows = data.participants.map((p: { userId: number; shareAmount: number; isPayer: boolean }, idx: number) => ({
      id: expenseParticipants.length + idx + 1,
      expenseId: expenseId,
      userId: p.userId,
      shareAmount: round2(p.shareAmount),
      isPayer: p.isPayer,
    }));
    if (!participantRows.some((p: { isPayer: boolean }) => p.isPayer)) {
      throw new Error('Нужен минимум один плательщик');
    }
    if (participantRows.length < 2) throw new Error('Нужно минимум два участника');
    const sumShares = round2(participantRows.reduce((sum: number, p: { shareAmount: number }) => sum + p.shareAmount, 0));
    if (Math.abs(round2(data.amount ?? old.amount) - sumShares) >= 0.01) {
      throw new Error('Сумма долей участников должна совпадать с суммой расхода');
    }
    for (let i = expenseParticipants.length - 1; i >= 0; i -= 1) {
      if (expenseParticipants[i].expenseId === expenseId) expenseParticipants.splice(i, 1);
    }
    expenseParticipants.push(...participantRows);
    data.participants = participantRows;
  }
  const now = new Date().toISOString();
  const updated = {
    ...old,
    ...data,
    updatedAt: now,
    updatedBy: userId,
  };
  expenses[index] = updated;
  recalculateGroupBalances(old.groupId);
  return updated;
};

export const deleteExpense = async (expenseId: number): Promise<void> => {
  await delay();
  const expense = expenses.find(e => e.id === expenseId);
  if (expense) {
    expense.isDeleted = true;
    recalculateGroupBalances(expense.groupId);
  }
};

export const getGroupBalances = async (groupId: number): Promise<GroupBalancesResponse> => {
  await delay();
  if (!balancesStore.some(b => b.groupId === groupId)) {
    recalculateGroupBalances(groupId);
  }
  const balances = balancesStore.filter(b => b.groupId === groupId);
  return { balances, recommended_transfers: balances.map(b => ({ creditorId: b.creditorId, debtorId: b.debtorId, amount: round2(b.amount - b.paidAmount) })).filter(t => t.amount >= 0.01) };
};

export const getMyBalances = async (groupId: number, userId: number) => {
  await delay();
  const { balances } = await getGroupBalances(groupId);
  return {
    owe_to: balances
      .filter(b => b.debtorId === userId && b.amount - b.paidAmount >= 0.01)
      .map(b => ({ balance_id: b.id, user_id: b.creditorId, amount: round2(b.amount - b.paidAmount) })),
    owed_by: balances
      .filter(b => b.creditorId === userId && b.amount - b.paidAmount >= 0.01)
      .map(b => ({ balance_id: b.id, user_id: b.debtorId, amount: round2(b.amount - b.paidAmount) })),
  };
};

export const payGroupBalance = async (groupId: number, balanceId: number, amount: number): Promise<Balance> => {
  await delay();
  const index = balancesStore.findIndex(b => b.id === balanceId && b.groupId === groupId);
  if (index === -1) throw new Error('Баланс не найден');
  const balance = balancesStore[index];
  const remaining = round2(balance.amount - balance.paidAmount);
  if (amount <= 0 || amount - remaining > 0.01) {
    throw new Error('Некорректная сумма оплаты');
  }
  balancesStore[index] = {
    ...balance,
    paidAmount: round2(balance.paidAmount + amount),
    lastUpdated: new Date().toISOString(),
  };
  return balancesStore[index];
};