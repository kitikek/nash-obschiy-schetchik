import { expenses, expenseParticipants, groups } from '../mocks/db';
import type { Expense, CreateExpenseData } from '../types/expense';

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export type CreateExpenseInput = Omit<CreateExpenseData, 'groupId'>;

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
  const participants = data.participantIds.map((userId, index) => ({
    id: expenseParticipants.length + index + 1,
    expenseId: newId,
    userId,
    debt: data.amount / data.participantIds.length,
    isPayer: userId === data.payerId,
    paid: false,
    paymentRequested: false,
  }));
  const now = new Date().toISOString();
  const newExpense: Expense = {
    id: newId,
    groupId: groupIdNum,
    description: data.description,
    amount: data.amount,
    date: data.date,
    createdBy: data.payerId,
    createdAt: now,
    updatedAt: now,
    updatedBy: data.payerId,
    isDeleted: false,
    participants,
  };
  expenses.push(newExpense);
  expenseParticipants.push(...participants);
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
  userId: number // добавим параметр userId
): Promise<Expense> => {
  await delay();
  const index = expenses.findIndex(e => e.id === expenseId);
  if (index === -1) throw new Error('Расход не найден');
  const old = expenses[index];
  const now = new Date().toISOString();
  const updated = {
    ...old,
    ...data,
    updatedAt: now,
    updatedBy: userId,
  };
  expenses[index] = updated;
  return updated;
};

export const deleteExpense = async (expenseId: number): Promise<void> => {
  await delay();
  const expense = expenses.find(e => e.id === expenseId);
  if (expense) expense.isDeleted = true;
};

export const requestPayment = async (participantId: number): Promise<void> => {
  await delay();
  const participant = expenseParticipants.find(p => p.id === participantId);
  if (participant) participant.paymentRequested = true;
};

export const confirmPayment = async (participantId: number): Promise<void> => {
  await delay();
  const participant = expenseParticipants.find(p => p.id === participantId);
  if (participant) {
    participant.paid = true;
    participant.paymentRequested = false;
  }
};