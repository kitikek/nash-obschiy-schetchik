import { api } from "./api"
import { mapGroupDto, type GroupDto } from "./apiMappers"
import type { Group, CreateGroupData, UpdateGroupData } from "../types/group"

interface GroupListRow {
  group: GroupDto
  my_balance: number | string
  participants_count?: number
}

interface GroupDetailResponse {
  group: GroupDto
  members: MemberRowDto[]
  stats?: { expenses_count?: number; [k: string]: unknown }
}

interface MemberRowDto {
  user_id: string
  username: string
  email?: string
  is_admin?: boolean
  joined_at?: string
}

export const getGroups = async (): Promise<Group[]> => {
  const { data } = await api.get<GroupListRow[]>("/groups")
  return data.map((row) => {
    const balance =
      typeof row.my_balance === "string"
        ? parseFloat(row.my_balance)
        : row.my_balance
    return mapGroupDto(row.group, {
      userBalance: balance,
      participantsCount: row.participants_count,
      participants: [],
    })
  })
}

export const getGroupById = async (id: string): Promise<Group | undefined> => {
  try {
    const { data } = await api.get<GroupDetailResponse>(`/groups/${id}`)
    const participants = data.members.map((m) => ({
      id: m.user_id,
      name: m.username,
      email: m.email ?? "",
      registrationDate: "",
      phone: undefined as string | undefined,
    }))
    const stats = data.stats as { expenses_count?: number } | undefined
    return mapGroupDto(data.group, {
      participants,
      expensesCount: stats?.expenses_count,
    })
  } catch {
    return undefined
  }
}

export const createGroup = async (data: CreateGroupData): Promise<Group> => {
  const { data: res } = await api.post<{ group: GroupDto }>("/groups", {
    name: data.name,
    description: data.description,
    currency: data.currency,
    member_ids: data.participantIds?.length ? data.participantIds : undefined,
  })
  return mapGroupDto(res.group, { participants: [] })
}

export const updateGroup = async (
  groupId: string,
  data: UpdateGroupData
): Promise<Group | undefined> => {
  const body: Record<string, unknown> = {}
  if (data.name !== undefined) body.name = data.name
  if (data.description !== undefined) body.description = data.description
  if (data.currency !== undefined) body.currency = data.currency
  const { data: res } = await api.put<{ group: GroupDto }>(`/groups/${groupId}`, body)
  return mapGroupDto(res.group)
}

export const deleteGroup = async (groupId: string): Promise<void> => {
  await api.delete(`/groups/${groupId}`)
}
