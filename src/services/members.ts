import { api } from "./api"

export interface GroupMemberView {
  id: string
  name: string
  isAdmin: boolean
}

export const getGroupMembers = async (
  groupId: string | number
): Promise<GroupMemberView[]> => {
  const { data } = await api.get<unknown>(`/groups/${groupId}/members`)
  const list = Array.isArray(data) ? data : []
  return list.map((item: unknown) => {
    const row = item as { member?: Record<string, unknown> } & Record<string, unknown>
    const m = (row.member ?? row) as {
      user_id?: string
      username?: string
      name?: string
      is_admin?: boolean
    }
    const id = m.user_id ?? ""
    return {
      id,
      name: m.username ?? m.name ?? `Пользователь ${id}`,
      isAdmin: Boolean(m.is_admin),
    }
  })
}

export const addMemberToGroup = async (
  groupId: string | number,
  userId: string | number
): Promise<void> => {
  await api.post(`/groups/${groupId}/members`, { user_id: userId })
}

export const removeMemberFromGroup = async (
  groupId: string | number,
  userId: string | number
): Promise<void> => {
  await api.delete(`/groups/${groupId}/members/${userId}`)
}
