// groupMember.ts

/**
 * Участник группы (связь многие-ко-многим).
 * Таблица "Участники групп".
 */
export interface GroupMember {
  id: number;                // ID участника группы (счетчик)
  userId: number;            // ID пользователя
  groupId: number;           // ID группы
  joinedAt: string;          // Дата присоединения (метка времени, ISO)
  isAdmin: boolean;          // Права администратора (логический)
}

/**
 * Данные для добавления участника в группу.
 */
export interface AddGroupMemberData {
  userId: number;
  groupId: number;
  isAdmin?: boolean;         // по умолчанию false
}