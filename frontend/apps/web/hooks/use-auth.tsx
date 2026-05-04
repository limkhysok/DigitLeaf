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
  verifyOTP: (username: string, otp: string) => Promise<void>
  verifyTOTP: (username: string, totp: string) => Promise<void>
  refreshUserProfile: () => Promise<void>
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

  const saveTokensToStorage = useCallback((newTokens: TokenResponse | null) => {
    if (globalThis.window !== undefined) {
      if (newTokens) {
        localStorage.setItem("auth_tokens", JSON.stringify(newTokens))
      } else {
        localStorage.removeItem("auth_tokens")
      }
      setTokens(newTokens)
    }
  }, [])

  const fetchCurrentUser = useCallback(async (currentTokens: TokenResponse) => {
    try {
      const profile = await apiClient.getMe(currentTokens.access_token)
      setUser(profile)
      return true
    } catch (err) {
      const error = err as Error
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
  }, [saveTokensToStorage])

  useEffect(() => {
    const initAuth = async () => {
      const storedTokens = loadTokensFromStorage()
      if (storedTokens) {
        setTokens(storedTokens)
        const success = await fetchCurrentUser(storedTokens)
        if (success) {
          // If authenticated and on landing or login page, redirect to dashboard
          if (pathname === "/" || pathname?.includes("/login")) {
            router.push("/dashboard")
          }
        } else if (pathname && !pathname.includes("/login") && !pathname.includes("/2fa-verify") && pathname !== "/") {
          // If token invalid and on protected route, redirect to login
          router.push("/login")
        }
      } else if (pathname && !pathname.includes("/login") && !pathname.includes("/2fa-verify") && pathname !== "/") {
        // Not authenticated, redirect to login if on protected route
        router.push("/login")
      }
      setIsLoading(false)
    }

    initAuth()
  }, [fetchCurrentUser, loadTokensFromStorage, pathname, router, tokens])

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await apiClient.login(username, password)
      
      if (response.mfa_required) {
        setIsLoading(false)
        const verifyUrl = `/2fa-verify?username=${encodeURIComponent(username)}`
        router.push(verifyUrl)
        return
      }
      saveTokensToStorage(response)
      await fetchCurrentUser(response)
      setIsLoading(false)
      router.push("/dashboard")
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }, [fetchCurrentUser, router, saveTokensToStorage])

  const verifyOTP = useCallback(async (username: string, otp: string) => {
    setIsLoading(true)
    try {
      const newTokens = await apiClient.verifyOTP(username, otp)
      saveTokensToStorage(newTokens)
      await fetchCurrentUser(newTokens)
      setIsLoading(false)
      router.push("/dashboard")
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }, [fetchCurrentUser, router, saveTokensToStorage])

  const verifyTOTP = useCallback(async (username: string, totp: string) => {
    setIsLoading(true)
    try {
      const newTokens = await apiClient.verifyTOTP(username, totp)
      saveTokensToStorage(newTokens)
      await fetchCurrentUser(newTokens)
      setIsLoading(false)
      router.push("/dashboard")
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }, [fetchCurrentUser, router, saveTokensToStorage])

  const refreshUserProfile = useCallback(async () => {
    if (tokens) {
      await fetchCurrentUser(tokens)
    }
  }, [fetchCurrentUser, tokens])

  const logout = useCallback(async () => {
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
  }, [router, saveTokensToStorage, tokens?.access_token])

  const contextValue = React.useMemo(
    () => ({ 
      user, 
      isLoading, 
      isAuthenticated: !!user, 
      login, 
      logout, 
      verifyOTP, 
      verifyTOTP,
      refreshUserProfile,
      tokens 
    }),
    [user, isLoading, tokens, login, logout, verifyOTP, verifyTOTP, refreshUserProfile]
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
