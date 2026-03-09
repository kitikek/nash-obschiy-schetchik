// src/services/user.ts
import { expenses, expenseParticipants } from '../mocks/db';
// import { delay } from './utils'; // если есть общая функция задержки

export const getUserTotalExpenses = async (userId: number): Promise<number> => {
  // await delay();
  // Ищем все расходы, где пользователь был плательщиком
  const payerParticipantIds = expenseParticipants
    .filter(ep => ep.userId === userId && ep.isPayer)
    .map(ep => ep.expenseId);
  
  const total = expenses
    .filter(exp => payerParticipantIds.includes(exp.id))
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  return total;
};

export const getUserGroupsCount = async (userId: number): Promise<number> => {
  // await delay();
  // Считаем количество групп, где пользователь является участником
  const { groupMembers } = await import('../mocks/db');
  return groupMembers.filter(gm => gm.userId === userId).length;
};