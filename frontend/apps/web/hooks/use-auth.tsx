"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { apiClient, UserProfile, TokenResponse } from "@/lib/api-client"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  tokens: TokenResponse | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [tokens, setTokens] = useState<TokenResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const loadTokensFromStorage = useCallback(() => {
    if (globalThis.window !== undefined) {
      const storedTokens = localStorage.getItem("auth_tokens")
      if (storedTokens) {
        try {
          return JSON.parse(storedTokens) as TokenResponse
        } catch (e) {
          console.error("Failed to parse tokens from storage", e)
          return null
        }
      }
    }
    return null
  }, [])

  const saveTokensToStorage = (newTokens: TokenResponse | null) => {
    if (globalThis.window !== undefined) {
      if (newTokens) {
        localStorage.setItem("auth_tokens", JSON.stringify(newTokens))
      } else {
        localStorage.removeItem("auth_tokens")
      }
      setTokens(newTokens)
    }
  }

  const fetchCurrentUser = useCallback(async (currentTokens: TokenResponse) => {
    try {
      const profile = await apiClient.getMe(currentTokens.access_token)
      setUser(profile)
      return true
    } catch (error: any) {
      // If unauthorized, attempt to refresh token
      // "Could not validate credentials" is the backend's standard 401 message
      if (
        error.message?.includes("Invalid") || 
        error.message?.includes("expired") || 
        error.message?.includes("validate credentials")
      ) {
        try {
          const newTokens = await apiClient.refreshToken(currentTokens.refresh_token)
          saveTokensToStorage(newTokens)
          const profile = await apiClient.getMe(newTokens.access_token)
          setUser(profile)
          return true
        } catch (refreshError) {
          console.error("Token refresh failed", refreshError)
          // Failed to refresh, logout completely
          saveTokensToStorage(null)
          setUser(null)
          return false
        }
      } else {
        console.error("Failed to fetch user", error)
        saveTokensToStorage(null)
        setUser(null)
        return false
      }
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      const storedTokens = loadTokensFromStorage()
      if (storedTokens) {
        setTokens(storedTokens)
        const success = await fetchCurrentUser(storedTokens)
        if (!success && pathname && !pathname.includes("/login") && pathname !== "/") {
          router.push("/login")
        }
      } else if (pathname && !pathname.includes("/login") && pathname !== "/") {
        // Not authenticated, redirect to login if on protected route
        router.push("/login")
      }
      setIsLoading(false)
    }

    initAuth()
  }, [fetchCurrentUser, loadTokensFromStorage, pathname, router])

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const newTokens = await apiClient.login(username, password)
      saveTokensToStorage(newTokens)
      await fetchCurrentUser(newTokens)
      router.push("/dashboard")
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      if (tokens?.access_token) {
        await apiClient.logout(tokens.access_token).catch(console.error)
      }
    } finally {
      saveTokensToStorage(null)
      setUser(null)
      router.push("/login")
      setIsLoading(false)
    }
  }

  const contextValue = React.useMemo(
    () => ({ user, isLoading, isAuthenticated: !!user, login, logout, tokens }),
    [user, isLoading, tokens]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
