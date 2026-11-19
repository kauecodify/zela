// Tipos de Usuarios
export type UserType = 'CIDADAO' | 'ADMIN_CONSORCIO' | 'ADMIN_PREFEITURA' | 'ADMIN_CONCESSIONARIA' | 'ADMIN_NACIONAL' | 'TECNICO' | 'FISCAL'

// Tipos de Client
export type ClientType = 'PREFEITURA' | 'CONCESSIONARIA' | 'EMPRESA' | 'OUTRO'

// Status de Ocorrencia
export type OccurrenceStatus = 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED' | 'CANCELLED' | 'ARCHIVED'

// Prioridade
export type Priority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'

// Nivel de Risco
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

// Fonte de Roteamento
export type RoutingSource = 'AUTO' | 'MANUAL' | 'WHATSAPP' | 'SMS' | 'WEB' | 'API'

// Tipos de autenticacao
export interface User {
  id: string
  email: string
  name: string
  userType: UserType
  consortiumId?: string
  clientId?: string
  municipalityId?: string
  isActive: boolean
  lastLogin?: string
  permissions: string[]
  roles: Role[]
}

export interface Role {
  id: string
  name: string
  description?: string
  isSystem: boolean
  permissions: Permission[]
}

export interface Permission {
  id: string
  code: string
  name: string
  description?: string
  resource: string
  action: string
}

// Auth Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Consortium Types
export interface Consortium {
  id: string
  name: string
  shortName: string
  cnpj: string
  state: string
  region: string
  isActive: boolean
  defaultSlaHours: number
  maxPriorityScore: number
  createdAt: string
  updatedAt: string
}

// Municipality Types
export interface Municipality {
  id: string
  ibgeCode: string
  name: string
  state: string
  region: string
  population: number
  areaKm2: number
  consortiumId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Client Types
export interface Client {
  id: string
  name: string
  clientType: ClientType
  cnpj?: string
  consortiumId: string
  municipalityId?: string
  isActive: boolean
  slaHours: number
  priorityWeight: number
  createdAt: string
  updatedAt: string
}

// Category Types
export interface Category {
  id: string
  name: string
  code: string
  description?: string
  icon?: string
  color?: string
  isActive: boolean
  parentId?: string
  createdAt: string
  updatedAt: string
  subcategories?: Subcategory[]
}

export interface Subcategory {
  id: string
  name: string
  code: string
  description?: string
  categoryId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Occurrence Types
export interface Occurrence {
  id: string
  protocol: string
  title?: string
  description?: string
  status: OccurrenceStatus
  priority: Priority
  riskLevel?: RiskLevel
  categoryId: string
  subcategoryId?: string
  latitude?: number
  longitude?: number
  address?: string
  referencePoint?: string
  censusSectorId?: string
  municipalityId: string
  consortiumId: string
  clientId?: string
  routedBy: RoutingSource
  confidenceScore?: number
  explanation?: string
  workflowId?: string
  workflowState?: string
  assignedUserId?: string
  assignedTeamId?: string
  resolvedUserId?: string
  resolvedAt?: string
  resolutionNote?: string
  resolutionPhoto?: string
  slaHours?: number
  slaDeadline?: string
  reopenCount: number
  createdBy?: string
  createdAt: string
  updatedAt: string
  dedupGroupId?: string
  isDuplicate?: boolean
  poolId?: string
  // Relacionamentos
  consortium?: Consortium
  client?: Client
  municipality?: Municipality
  category?: Category
  subcategory?: Subcategory
  assignedUser?: User
  resolvedUser?: User
  medias?: Media[]
  attachments?: Attachment[]
  feedback?: Feedback
}

export interface Media {
  id: string
  occurrenceId: string
  mediaType: 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT'
  url: string
  thumbnailUrl?: string
  fileName: string
  fileSize: number
  mimeType: string
  metadata?: any
  createdAt: string
  transcription?: Transcription
  classification?: Classification
}

export interface Attachment {
  id: string
  occurrenceId: string
  fileName: string
  url: string
  mimeType: string
  fileSize: number
  createdAt: string
}

export interface Transcription {
  id: string
  mediaId: string
  text: string
  language: string
  model: string
  confidence?: number
  duration?: number
  createdAt: string
}

export interface Classification {
  id: string
  mediaId: string
  categoryId: string
  subcategoryId?: string
  confidence: number
  model: string
  explanation?: string
  createdAt: string
}

export interface Feedback {
  id: string
  occurrenceId: string
  citizenId?: string
  rating: number
  comment?: string
  isResolved: boolean
  createdAt: string
}

// Pool Lowdataesc Types
export interface PoolLowdataesc {
  id: string
  name: string
  description?: string
  consortiumId: string
  isActive: boolean
  rateLimitPerMinute: number
  storageQuotaGB: number
  computeQuota: number
  createdAt: string
  updatedAt: string
}

// Analytics Types
export interface AnalyticsEvent {
  id: string
  occurrenceId?: string
  userId?: string
  eventType: AnalyticsEventType
  metadata: any
  timestamp: string
}

export type AnalyticsEventType = 
  | 'OCCURRENCE_CREATED'
  | 'OCCURRENCE_ASSIGNED'
  | 'OCCURRENCE_RESOLVED'
  | 'OCCURRENCE_REOPENED'
  | 'USER_LOGIN'
  | 'NOTIFICATION_SENT'
  | 'WORKFLOW_STEP_COMPLETED'
  | 'SLA_BREACHED'

// Dashboard Types
export interface DashboardStats {
  totalOccurrences: number
  pendingOccurrences: number
  inProgressOccurrences: number
  resolvedOccurrences: number
  overdueOccurrences: number
  avgResolutionTime: number
  avgSlaCompliance: number
  occurrencesByCategory: Record<string, number>
  occurrencesByPriority: Record<string, number>
  occurrencesByStatus: Record<string, number>
  occurrencesByMunicipality: Record<string, number>
  recentOccurrences: Occurrence[]
  recentActivities: AnalyticsEvent[]
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ErrorResponse {
  error: string
  message: string
  details?: any
  timestamp: string
}

// Filter Types
export interface OccurrenceFilters {
  consortiumId?: string
  clientId?: string
  municipalityId?: string
  categoryId?: string
  subcategoryId?: string
  status?: OccurrenceStatus
  priority?: Priority
  riskLevel?: RiskLevel
  assignedUserId?: string
  startDate?: string
  endDate?: string
  search?: string
  page?: number
  limit?: number
}

export interface UserFilters {
  consortiumId?: string
  clientId?: string
  userType?: UserType
  isActive?: boolean
  search?: string
  page?: number
  limit?: number
}

// Select Option Types
export interface SelectOption {
  value: string
  label: string
}

// Chart Types
export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
}
