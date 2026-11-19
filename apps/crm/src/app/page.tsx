'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirecionar para o dashboard apropriado
        switch (user.userType) {
          case 'ADMIN_NACIONAL':
            router.push('/admin')
            break
          case 'ADMIN_CONSORCIO':
            router.push('/consortium')
            break
          case 'ADMIN_PREFEITURA':
          case 'TECNICO':
          case 'FISCAL':
            router.push('/prefeitura')
            break
          default:
            router.push('/auth/login')
        }
      } else {
        router.push('/auth/login')
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return null
}
