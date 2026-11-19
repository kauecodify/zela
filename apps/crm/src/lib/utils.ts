import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateProtocol(consortiumShortName: string): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${consortiumShortName.toUpperCase()}-${timestamp}-${random}`
}

export function calculateSLA(deadline: Date | string): { days: number; hours: number; minutes: number; isOverdue: boolean } {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = deadlineDate.getTime() - now.getTime()
  
  const isOverdue = diff < 0
  const absDiff = Math.abs(diff)
  
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))
  
  return { days, hours, minutes, isOverdue }
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    NORMAL: 'bg-blue-500',
    LOW: 'bg-green-500'
  }
  return colors[priority] || 'bg-gray-500'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    PENDING: 'bg-blue-100 text-blue-600',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-600',
    RESOLVED: 'bg-green-100 text-green-600',
    REOPENED: 'bg-orange-100 text-orange-600',
    CANCELLED: 'bg-red-100 text-red-600',
    ARCHIVED: 'bg-gray-100 text-gray-600'
  }
  return colors[status] || 'bg-gray-100 text-gray-600'
}
