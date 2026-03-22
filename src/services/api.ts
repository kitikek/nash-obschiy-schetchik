import axios from "axios"
import type { AxiosError } from "axios"

export class ApiError extends Error {
  readonly code?: string
  readonly field?: string
  readonly status?: number

  constructor(message: string, code?: string, field?: string, status?: number) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.field = field
    this.status = status
  }
}

function getToken(): string | null {
  return localStorage.getItem("token") || sessionStorage.getItem("token")
}

export const api = axios.create({
  baseURL: "/api/v1",
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError<{ error?: string; code?: string; field?: string }>) => {
    const status = err.response?.status
    const data = err.response?.data
    const message = data?.error ?? err.message ?? "Ошибка сети"
    return Promise.reject(new ApiError(message, data?.code, data?.field, status))
  }
)
