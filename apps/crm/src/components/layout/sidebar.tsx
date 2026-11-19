'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ShieldCheck,
  FileText,
  Bell,
  CreditCard,
  Search,
  Package
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const getNavItems = () => {
    const baseItems = [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        visible: true
      },
      {
        title: 'Ocorrencias',
        href: '/occurrences',
        icon: FileText,
        visible: true
      },
      {
        title: 'Usuarios',
        href: '/users',
        icon: Users,
        visible: user?.userType === 'ADMIN_NACIONAL' || user?.userType === 'ADMIN_CONSORCIO'
      },
      {
        title: 'Consorcios',
        href: '/consortium',
        icon: Building2,
        visible: user?.userType === 'ADMIN_NACIONAL' || user?.userType === 'ADMIN_CONSORCIO'
      },
      {
        title: 'Clientes',
        href: '/clients',
        icon: Package,
        visible: user?.userType === 'ADMIN_NACIONAL' || user?.userType === 'ADMIN_CONSORCIO'
      },
      {
        title: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        visible: user?.userType === 'ADMIN_NACIONAL' || user?.userType === 'ADMIN_CONSORCIO'
      },
      {
        title: 'Notificacoes',
        href: '/notifications',
        icon: Bell,
        visible: true
      },
      {
        title: 'Pool Lowdataesc',
        href: '/pool',
        icon: ShieldCheck,
        visible: user?.userType === 'ADMIN_NACIONAL'
      },
      {
        title: 'Faturamento',
        href: '/billing',
        icon: CreditCard,
        visible: user?.userType === 'ADMIN_NACIONAL' || user?.userType === 'ADMIN_CONSORCIO'
      },
      {
        title: 'Configuracoes',
        href: '/settings',
        icon: Settings,
        visible: true
      },
      {
        title: 'Ajuda',
        href: '/help',
        icon: HelpCircle,
        visible: true
      }
    ]

    return baseItems.filter(item => item.visible)
  }

  const handleLogout = async () => {
    await logout()
  }

  const navItems = getNavItems()

  return (
    <div className={cn('fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-background p-4', className)}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            Z
          </div>
          <div>
            <h1 className="font-semibold">Zela Nacional</h1>
            <p className="text-xs text-muted-foreground">CRM</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}
