import { api } from "./api"

export interface GroupMemberView {
  id: number
  name: string
  isAdmin: boolean
}

export const getGroupMembers = async (
  groupId: string | number
): Promise<GroupMemberView[]> => {
  const gid = typeof groupId === "string" ? parseInt(groupId, 10) : groupId
  const { data } = await api.get<unknown>(`/groups/${gid}/members`)
  const list = Array.isArray(data) ? data : []
  return list.map((item: unknown) => {
    const row = item as { member?: Record<string, unknown> } & Record<string, unknown>
    const m = (row.member ?? row) as {
      user_id?: number
      username?: string
      name?: string
      is_admin?: boolean
    }
    const id = m.user_id ?? 0
    return {
      id,
      name: m.username ?? m.name ?? `Пользователь ${id}`,
      isAdmin: Boolean(m.is_admin),
    }
  })
}

export const addMemberToGroup = async (
  groupId: string | number,
  userId: number
): Promise<void> => {
  const gid = typeof groupId === "string" ? parseInt(groupId, 10) : groupId
  await api.post(`/groups/${gid}/members`, { user_id: userId })
}

export const removeMemberFromGroup = async (
  groupId: string | number,
  userId: number
): Promise<void> => {
  const gid = typeof groupId === "string" ? parseInt(groupId, 10) : groupId
  await api.delete(`/groups/${gid}/members/${userId}`)
}
