import { groups, groupMembers, users, expenses } from '../mocks/db';
import type { Group, CreateGroupData, UpdateGroupData } from '../types/group';

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const getGroups = async (): Promise<Group[]> => {
  await delay();
  return groups
    .filter(g => g.status === true) // только активные группы
    .map(group => ({
      ...group,
      participants: groupMembers
        .filter(gm => gm.groupId === group.id)
        .map(gm => users.find(u => u.id === gm.userId)!)
        .filter(Boolean),
      expenses: expenses.filter(e => e.groupId === group.id && !e.isDeleted)
    }))
    .sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
};

export const getGroupById = async (id: number): Promise<Group | undefined> => {
  await delay();
  const group = groups.find(g => g.id === id && g.status === true);
  if (!group) return undefined;
  return {
    ...group,
    participants: groupMembers
      .filter(gm => gm.groupId === id)
      .map(gm => users.find(u => u.id === gm.userId)!)
      .filter(Boolean)
  };
};

export const createGroup = async (data: CreateGroupData & { authorId: number }): Promise<Group> => {
  await delay();
  const newGroup: Group = {
    id: groups.length + 1,
    name: data.name,
    description: data.description || '',
    authorId: data.authorId,
    createdAt: new Date().toISOString().split('T')[0],
    status: true,
    currency: data.currency,
    participants: [],
  };
  groups.push(newGroup);
  groupMembers.push({
    id: groupMembers.length + 1,
    userId: data.authorId,
    groupId: newGroup.id,
    joinedAt: new Date().toISOString(),
    isAdmin: true,
  });
  return newGroup;
};

export const updateGroup = async (
  groupId: number,
  data: UpdateGroupData
): Promise<Group | undefined> => {
  await delay();
  const groupIndex = groups.findIndex(g => g.id === groupId && g.status === true);
  if (groupIndex === -1) return undefined;
  const oldGroup = groups[groupIndex];
  const updatedGroup = {
    ...oldGroup,
    ...data,
    updatedAt: new Date().toISOString().split('T')[0],
  };
  groups[groupIndex] = updatedGroup;
  return updatedGroup;
};

export const deleteGroup = async (groupId: number): Promise<void> => {
  await delay();
  const groupIndex = groups.findIndex(g => g.id === groupId);
  if (groupIndex === -1) throw new Error('Группа не найдена');
  groups[groupIndex].status = false;
  // Помечаем все расходы группы как удалённые
  expenses.forEach(exp => {
    if (exp.groupId === groupId) exp.isDeleted = true;
  });
};