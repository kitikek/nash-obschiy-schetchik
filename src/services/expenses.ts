// src/services/expenses.ts
import { expenses, expenseParticipants, groups } from '../mocks/db';
import type { Expense, CreateExpenseData } from '../types/expense';

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Тип для данных без groupId
export type CreateExpenseInput = Omit<CreateExpenseData, 'groupId'>;

export const getExpensesByGroup = async (groupId: string | number): Promise<Expense[]> => {
  await delay();
  const groupIdNum = typeof groupId === 'string' ? parseInt(groupId, 10) : groupId;
  return expenses.filter(exp => exp.groupId === groupIdNum).map(exp => ({
    ...exp,
    participants: expenseParticipants.filter(p => p.expenseId === exp.id)
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
    paid: userId === data.payerId, // плательщик считается оплатившим сразу
    paymentRequested: false,
  }));
  const newExpense: Expense = {
    id: newId,
    groupId: groupIdNum,
    description: data.description,
    amount: data.amount,
    date: data.date,
    createdBy: data.payerId,
    createdAt: new Date().toISOString(),
    isDeleted: false,
    participants,
  };
  expenses.push(newExpense);
  expenseParticipants.push(...participants);

  // Обновляем дату группы
  const group = groups.find(g => g.id === groupIdNum);
  if (group) {
    group.updatedAt = new Date().toISOString().split('T')[0];
  }

  return newExpense;
};

export const getUserExpenses = async (userId: number) => {
  await delay();
  // Все расходы, где пользователь участвует
  const participantExpenseIds = expenseParticipants
    .filter(ep => ep.userId === userId)
    .map(ep => ep.expenseId);
  const userExpenses = expenses.filter(exp => participantExpenseIds.includes(exp.id));
  // Сортируем по дате
  return userExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getExpenseById = async (expenseId: number): Promise<Expense | undefined> => {
  await delay();
  const expense = expenses.find(e => e.id === expenseId);
  if (!expense) return undefined;
  return {
    ...expense,
    participants: expenseParticipants.filter(p => p.expenseId === expenseId)
  };
};

// Должник запрашивает подтверждение оплаты
export const requestPayment = async (participantId: number): Promise<void> => {
  await delay();
  const participant = expenseParticipants.find(p => p.id === participantId);
  if (!participant) throw new Error('Участник не найден');
  participant.paymentRequested = true;
};

// Плательщик подтверждает оплату
export const confirmPayment = async (participantId: number): Promise<void> => {
  await delay();
  const participant = expenseParticipants.find(p => p.id === participantId);
  if (!participant) throw new Error('Участник не найден');
  participant.paid = true;
  participant.paymentRequested = false;
};