import { api, ApiError } from "./api"
import { mapUserDto, type UserDto } from "./apiMappers"
import type { User } from "../types/user"

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  phone?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export const login = async ({
  email,
  password,
}: LoginCredentials): Promise<AuthResponse> => {
  const { data } = await api.post<{ token: string; user: UserDto }>("/auth/login", {
    email,
    password,
  })
  return { token: data.token, user: mapUserDto(data.user) }
}

/** Регистрация по спеке возвращает только id/username/email; дальше — вход. */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  await api.post("/auth/register", {
    username: data.username,
    email: data.email,
    password: data.password,
    ...(data.phone ? { phone: data.phone } : {}),
  })
  return login({ email: data.email, password: data.password })
}

export const logout = async (): Promise<void> => {
  try {
    await api.post("/auth/logout")
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return
    throw e
  }
}
