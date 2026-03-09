// src/services/members.ts
import { groupMembers, users, groups } from '../mocks/db';

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const getGroupMembers = async (groupId: string | number) => {
  await delay();
  const groupIdNum = typeof groupId === 'string' ? parseInt(groupId, 10) : groupId;
  const memberIds = groupMembers.filter(gm => gm.groupId === groupIdNum).map(gm => gm.userId);
  return users.filter(u => memberIds.includes(u.id)).map(u => ({ id: u.id, name: u.name }));
};

export const addMemberToGroup = async (groupId: string | number, email: string): Promise<void> => {
  await delay();
  const groupIdNum = typeof groupId === 'string' ? parseInt(groupId, 10) : groupId;
  const user = users.find(u => u.email === email);
  if (!user) {
    throw new Error('Пользователь с таким email не найден');
  }
  const existing = groupMembers.find(gm => gm.groupId === groupIdNum && gm.userId === user.id);
  if (existing) {
    throw new Error('Пользователь уже в группе');
  }
  const newId = groupMembers.length + 1;
  groupMembers.push({
    id: newId,
    userId: user.id,
    groupId: groupIdNum,
    joinedAt: new Date().toISOString(),
    isAdmin: false,
  });

  // Обновляем дату группы
  const group = groups.find(g => g.id === groupIdNum);
  if (group) {
    group.updatedAt = new Date().toISOString().split('T')[0];
  }
};