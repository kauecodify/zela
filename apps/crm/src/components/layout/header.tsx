'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Bell, Search, User, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'

interface HeaderProps {
  onMenuClick?: () => void
  className?: string
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')

  const getPageTitle = () => {
    const pathMap: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/occurrences': 'Ocorrencias',
      '/users': 'Usuarios',
      '/consortium': 'Consorcios',
      '/clients': 'Clientes',
      '/analytics': 'Analytics',
      '/notifications': 'Notificacoes',
      '/pool': 'Pool Lowdataesc',
      '/billing': 'Faturamento',
      '/settings': 'Configuracoes',
      '/help': 'Ajuda'
    }

    const path = Object.keys(pathMap).find(key => pathname === key || pathname.startsWith(`${key}/`))
    return pathMap[path || ''] || 'Zela Nacional'
  }

  return (
    <header className={cn('fixed top-0 left-64 right-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div>
            <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
            <p className="text-xs text-muted-foreground hidden lg:block">
              Sistema de Controle de Zeladoria Urbana
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10"
            />
          </div>
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
              3
            </span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span className="hidden md:inline">Conta</span>
                <ChevronDown className="h-4 w-4 hidden md:inline" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <User className="h-4 w-4 mr-2" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuracoes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/help">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Ajuda
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
