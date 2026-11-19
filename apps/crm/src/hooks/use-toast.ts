'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface ToastAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'destructive'
}

interface ToastProps {
  id: string
  title?: string
  description?: string
  action?: ToastAction
  variant?: 'default' | 'destructive'
  duration?: number
}

interface ToastContextType {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id'>) => string
  dismissToast: (id: string) => void
  updateToast: (id: string, updates: Partial<ToastProps>) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = useCallback((toast: Omit<ToastProps, 'id'>): string => {
    const id = Math.random().toString(36).substring(2, 15)
    
    setToasts((prev) => [...prev, { id, ...toast }])
    
    // Auto-dismiss after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, toast.duration || 4000)
    }
    
    return id
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const updateToast = useCallback((id: string, updates: Partial<ToastProps>) => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast))
    )
  }, [])

  const value: ToastContextType = {
    toasts,
    addToast,
    dismissToast,
    updateToast
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  
  return context
}

export function toast(options: Omit<ToastProps, 'id'>): string {
  const { addToast } = useToast()
  return addToast(options)
}

export { ToastProvider }
