'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { User, AuthResponse, LoginCredentials, AuthState } from '@/types'
import { api } from '@/services/api'

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  updateUser: (user: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)
  const router = useRouter()

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials)
      
      const { user, accessToken, refreshToken } = response.data
      
      // Salvar no localStorage
      localStorage.setItem('zela_access_token', accessToken)
      localStorage.setItem('zela_refresh_token', refreshToken)
      localStorage.setItem('zela_user', JSON.stringify(user))
      
      // Atualizar estado
      setState({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false
      })
      
      // Redirecionar para a pagina inicial
      router.push('/')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      // Limpar localStorage
      localStorage.removeItem('zela_access_token')
      localStorage.removeItem('zela_refresh_token')
      localStorage.removeItem('zela_user')
      
      // Atualizar estado
      setState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false
      })
      
      // Redirecionar para login
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }, [router])

  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('zela_refresh_token')
      
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }
      
      const response = await api.post<AuthResponse>('/auth/refresh', {
        refreshToken
      })
      
      const { user, accessToken, refreshToken: newRefreshToken } = response.data
      
      // Salvar no localStorage
      localStorage.setItem('zela_access_token', accessToken)
      localStorage.setItem('zela_refresh_token', newRefreshToken)
      localStorage.setItem('zela_user', JSON.stringify(user))
      
      // Atualizar estado
      setState({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      console.error('Refresh token error:', error)
      await logout()
    }
  }, [logout])

  const updateUser = useCallback((user: Partial<User>) => {
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, ...user } as User
    }))
    
    // Atualizar localStorage
    const storedUser = localStorage.getItem('zela_user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      localStorage.setItem('zela_user', JSON.stringify({ ...parsedUser, ...user }))
    }
  }, [])

  // Carregar estado inicial do localStorage
  useEffect(() => {
    const accessToken = localStorage.getItem('zela_access_token')
    const user = localStorage.getItem('zela_user')
    
    if (accessToken && user) {
      try {
        const parsedUser = JSON.parse(user) as User
        setState({
          user: parsedUser,
          accessToken,
          isAuthenticated: true,
          isLoading: false
        })
      } catch (error) {
        console.error('Error parsing user:', error)
        localStorage.removeItem('zela_access_token')
        localStorage.removeItem('zela_user')
        setState({
          ...initialState,
          isLoading: false
        })
      }
    } else {
      setState({
        ...initialState,
        isLoading: false
      })
    }
  }, [])

  // Configurar interceptor para atualizar token
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          try {
            await refreshToken()
            // Retentar a requisicao original
            return api(error.config)
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
            await logout()
            return Promise.reject(refreshError)
          }
        }
        return Promise.reject(error)
      }
    )

    return () => {
      api.interceptors.response.eject(interceptor)
    }
  }, [refreshToken, logout])

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    updateUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}
