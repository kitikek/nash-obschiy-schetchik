import { api } from "./api"
import { mapUserDto, type UserDto } from "./apiMappers"
import type { User } from "../types/user"

export interface MeStats {
  groups_count: number
  expenses_count: number
  member_since?: string
  total_turnover: number | string
}

export interface MeResponse {
  user: UserDto
  stats: MeStats
}

export const fetchMe = async (): Promise<{ user: User; stats: MeStats }> => {
  const { data } = await api.get<MeResponse>("/users/me")
  return { user: mapUserDto(data.user), stats: data.stats }
}

export const updateMe = async (body: {
  username?: string
  phone?: string
}): Promise<User> => {
  const { data } = await api.put<{ user: UserDto }>("/users/me", {
    ...(body.username !== undefined ? { username: body.username } : {}),
    ...(body.phone !== undefined ? { phone: body.phone } : {}),
  })
  return mapUserDto(data.user)
}

export const changePassword = async (
  old_password: string,
  new_password: string
): Promise<void> => {
  await api.patch("/users/me/password", { old_password, new_password })
}

export interface FoundUser {
  id: string
  username: string
}

export const findUserByEmail = async (email: string): Promise<FoundUser | null> => {
  try {
    const { data } = await api.post<{ id?: unknown; username?: string }>("/users/find", {
      email: email.trim(),
    })
    const id = data?.id != null ? String(data.id) : ""
    if (!id) return null
    return { id, username: String(data.username ?? "") }
  } catch {
    return null
  }
}
