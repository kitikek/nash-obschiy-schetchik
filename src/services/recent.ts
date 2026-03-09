import { expenses, groups } from '../mocks/db';

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const getRecentExpenses = async (limit: number = 5) => {
  await delay();
  // Берём последние расходы (по дате)
  const sorted = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recent = sorted.slice(0, limit).map(exp => {
    const group = groups.find(g => g.id === exp.groupId);
    return {
      id: exp.id,
      description: exp.description,
      amount: exp.amount,
      date: exp.date,
      groupName: group?.name || '',
      groupId: exp.groupId,
    };
  });
  return recent;
};