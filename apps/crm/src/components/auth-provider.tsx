'use client'

import { AuthProvider as BaseAuthProvider } from '@/hooks/use-auth'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <BaseAuthProvider>{children}</BaseAuthProvider>
}
