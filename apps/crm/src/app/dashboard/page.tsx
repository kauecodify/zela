'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { api } from '@/services/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MainLayout } from '@/components/layout/main-layout'
import { 
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Loader2
} from 'lucide-react'
import { cn, formatNumber, getStatusColor, calculateSLA } from '@/lib/utils'
import { Occurrence, OccurrenceStatus } from '@/types'

// Componentes de estatisticas
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change,
  className 
}: {
  title: string
  value: string | number
  icon: React.ElementType
  change?: string
  className?: string
}) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm">{title}</CardDescription>
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={cn(
            'text-xs mt-1',
            change.startsWith('+') ? 'text-green-600' : 'text-red-600'
          )}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Componente de lista de ocorrencias
function RecentOccurrences({ occurrences }: { occurrences: Occurrence[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ocorrencias Recentes</CardTitle>
        <CardDescription>Ultimas 10 ocorrencias registradas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {occurrences.map((occurrence) => {
            const sla = occurrence.slaDeadline ? calculateSLA(occurrence.slaDeadline) : null
            
            return (
              <div 
                key={occurrence.id} 
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'p-2 rounded-full',
                    getStatusColor(occurrence.status)
                  )}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{occurrence.protocol}</p>
                    <p className="text-sm text-muted-foreground">{occurrence.title || occurrence.description?.slice(0, 50)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    getStatusColor(occurrence.priority)
                  )}>
                    {occurrence.priority}
                  </span>
                  {sla && sla.isOverdue && (
                    <span className="text-red-500 text-xs">ATRASADO</span>
                  )}
                  <Button variant="ghost" size="sm">
                    Ver
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de status das ocorrencias
function OccurrenceStatusChart({ data }: { data: { status: OccurrenceStatus; count: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status das Ocorrencias</CardTitle>
        <CardDescription>Distribuicao por status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => {
            const percentage = (item.count / total) * 100
            
            return (
              <div key={item.status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{item.status}</span>
                  <span className="text-sm font-medium">{formatNumber(item.count)} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn('h-full rounded-full transition-all', getStatusColor(item.status))}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de SLA
function SLAStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status de SLA</CardTitle>
        <CardDescription>Conformidade com prazos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Dentro do Prazo</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-medium">78%</span>
              <div className="h-2 w-32 bg-muted rounded-full">
                <div className="h-full w-[78%] bg-green-500 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span>Em Andamento</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-medium">15%</span>
              <div className="h-2 w-32 bg-muted rounded-full">
                <div className="h-full w-[15%] bg-yellow-500 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Fora do Prazo</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-medium">7%</span>
              <div className="h-2 w-32 bg-muted rounded-full">
                <div className="h-full w-[7%] bg-red-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Pagina principal do dashboard
export default function DashboardPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOccurrences: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    overdue: 0
  })
  const [recentOccurrences, setRecentOccurrences] = useState<Occurrence[]>([])
  const [statusData, setStatusData] = useState<{ status: OccurrenceStatus; count: number }[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Buscar estatisticas
        const statsResponse = await api.get('/analytics/stats')
        if (statsResponse.data) {
          setStats({
            totalOccurrences: statsResponse.data.totalOccurrences || 0,
            pending: statsResponse.data.pending || 0,
            inProgress: statsResponse.data.inProgress || 0,
            resolved: statsResponse.data.resolved || 0,
            overdue: statsResponse.data.overdue || 0
          })
        }
        
        // Buscar ocorrencias recentes
        const occurrencesResponse = await api.get('/occurrences', {
          params: { limit: 10 }
        })
        if (occurrencesResponse.data?.data) {
          setRecentOccurrences(occurrencesResponse.data.data)
        }
        
        // Buscar dados de status
        const statusResponse = await api.get('/analytics/occurrences-by-status')
        if (statusResponse.data) {
          setStatusData(Object.entries(statusResponse.data).map(([status, count]) => ({
            status: status as OccurrenceStatus,
            count
          })))
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [user])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Bem vindo */}
        <div>
          <h1 className="text-2xl font-bold">Bem-vindo de volta, {user?.name}!</h1>
          <p className="text-muted-foreground">
            Aqui esta um resumo das atividades recentes do sistema.
          </p>
        </div>

        {/* Estatisticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Ocorrencias"
            value={formatNumber(stats.totalOccurrences)}
            icon={FileText}
            change="+12% este mes"
          />
          <StatCard
            title="Pendentes"
            value={formatNumber(stats.pending)}
            icon={Clock}
            change="-5%"
          />
          <StatCard
            title="Em Andamento"
            value={formatNumber(stats.inProgress)}
            icon={TrendingUp}
            change="+8%"
          />
          <StatCard
            title="Resolvidas"
            value={formatNumber(stats.resolved)}
            icon={CheckCircle}
            change="+15%"
            className="bg-green-500/10"
          />
        </div>

        {/* Cartoes principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOccurrences occurrences={recentOccurrences} />
          <div className="space-y-6">
            <OccurrenceStatusChart data={statusData} />
            <SLAStatus />
          </div>
        </div>

        {/* Acoes rapidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acoes Rapidas</CardTitle>
            <CardDescription>Atalhos para acoes comuns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-24 flex flex-col justify-center items-center gap-2">
                <FileText className="h-6 w-6" />
                <span>Nova Ocorrencia</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col justify-center items-center gap-2">
                <Users className="h-6 w-6" />
                <span>Novo Usuario</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col justify-center items-center gap-2">
                <Building2 className="h-6 w-6" />
                <span>Novo Consorcio</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col justify-center items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                <span>Relatorios</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

import { BarChart3 } from 'lucide-react'
