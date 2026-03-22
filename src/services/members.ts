import { api } from "./api"
import { normUserId } from "../utils/userId"

export interface GroupMemberView {
  id: string
  name: string
  isAdmin: boolean
}

/** GET /groups/:id/members — по спеке: [{ id, username, email, is_admin, joined_at }] */
export const getGroupMembers = async (
  groupId: string | number
): Promise<GroupMemberView[]> => {
  const { data } = await api.get<unknown>(`/groups/${groupId}/members`)
  const list = Array.isArray(data) ? data : []
  return list.map((item: unknown) => {
    const row = item as { member?: Record<string, unknown> } & Record<string, unknown>
    const m = (row.member ?? row) as {
      id?: string | number
      user_id?: string | number
      username?: string
      name?: string
      is_admin?: boolean
    }
    const id = normUserId(m.id ?? m.user_id)
    return {
      id,
      name: m.username ?? m.name ?? `Пользователь ${id || "?"}`,
      isAdmin: Boolean(m.is_admin),
    }
  })
}

/** POST /groups/:id/members — тело { email } (schetchik-backend/backend_spec.md) */
export const addMemberToGroup = async (
  groupId: string | number,
  email: string
): Promise<void> => {
  const trimmed = email.trim()
  if (!trimmed) {
    throw new Error("Укажите email")
  }
  await api.post(`/groups/${groupId}/members`, { email: trimmed })
}

export const removeMemberFromGroup = async (
  groupId: string | number,
  userId: string | number
): Promise<void> => {
  await api.delete(`/groups/${groupId}/members/${userId}`)
}
