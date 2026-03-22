import React, { createContext, useState, useContext, useEffect, type ReactNode } from "react"
import type { User } from "../types/user"
import { fetchMe } from "../services/user"
import { logout as apiLogout } from "../services/auth"
import { ApiError } from "../services/api"

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (token: string, userData: User, remember?: boolean) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function clearStoredSession() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  sessionStorage.removeItem("token")
  sessionStorage.removeItem("user")
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  const refreshUser = async () => {
    const { user: u } = await fetchMe()
    setUser(u)
    if (localStorage.getItem("token")) {
      localStorage.setItem("user", JSON.stringify(u))
    } else if (sessionStorage.getItem("token")) {
      sessionStorage.setItem("user", JSON.stringify(u))
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token")
    if (!token) return

    const cached = localStorage.getItem("user") || sessionStorage.getItem("user")
    if (cached) {
      try {
        setUser(JSON.parse(cached) as User)
        setIsAuthenticated(true)
      } catch {
        /* ignore */
      }
    }

    fetchMe()
      .then(({ user: u }) => {
        setIsAuthenticated(true)
        setUser(u)
        if (localStorage.getItem("token")) {
          localStorage.setItem("user", JSON.stringify(u))
        } else {
          sessionStorage.setItem("user", JSON.stringify(u))
        }
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          clearStoredSession()
        }
        setIsAuthenticated(false)
        setUser(null)
      })
  }, [])

  const login = (token: string, userData: User, remember: boolean = false) => {
    clearStoredSession()
    if (remember) {
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(userData))
    } else {
      sessionStorage.setItem("token", token)
      sessionStorage.setItem("user", JSON.stringify(userData))
    }
    setIsAuthenticated(true)
    setUser(userData)
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch {
      /* сеть / 401 — всё равно чистим сессию */
    }
    clearStoredSession()
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
