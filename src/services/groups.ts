// src/services/groups.ts
import { groups, groupMembers, users, expenses } from '../mocks/db';
import type { Group, CreateGroupData } from '../types/group';

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const getGroups = async (): Promise<Group[]> => {
  await delay();
  return groups
    .map(group => ({
      ...group,
      participants: groupMembers
        .filter(gm => gm.groupId === group.id)
        .map(gm => users.find(u => u.id === gm.userId)!)
        .filter(Boolean),
      expenses: expenses.filter(e => e.groupId === group.id)
    }))
    .sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
};

export const getGroupById = async (id: number): Promise<Group | undefined> => {
  await delay();
  const group = groups.find(g => g.id === id);
  if (!group) return undefined;
  return {
    ...group,
    participants: groupMembers
      .filter(gm => gm.groupId === id)
      .map(gm => users.find(u => u.id === gm.userId)!)
      .filter(Boolean)
  };
};

// src/services/groups.ts
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
  // Добавляем автора как участника
  groupMembers.push({
    id: groupMembers.length + 1,
    userId: data.authorId,
    groupId: newGroup.id,
    joinedAt: new Date().toISOString(),
    isAdmin: true,
  });
  return newGroup;
};