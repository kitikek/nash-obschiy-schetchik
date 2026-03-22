// group.ts
// group.ts
import type { User } from './user';

/**
 * Группа совместных расходов.
 * Таблица "Группы".
 */
export interface Group {
  id: string;                // ID группы (xid)
  name: string;              // Название группы (до 100 символов)
  description?: string;      // Описание (до 500 символов)
  authorId: string;          // ID автора (создателя) группы
  createdAt: string;         // Дата создания (ISO)
  updatedAt?: string;        // Дата последнего обновления (ISO)
  status: boolean;           // Статус группы (активна/архивирована)
  currency: string;          // Валюта группы (например, "RUB", "USD")

  participants?: User[];     // Список участников (опционально)

  // === Новые поля для карточки ===
  expensesCount?: number;    // Количество расходов в группе
  userBalance?: number;      // Баланс текущего пользователя
}

/**
 * Данные для создания новой группы.
 */
export interface CreateGroupData {
  name: string;
  description?: string;
  currency: string;
  participantIds?: string[];
}

/**
 * Обновление группы (частичное).
 */
export interface UpdateGroupData {
  name?: string;
  description?: string;
  status?: boolean;
  currency?: string;
}