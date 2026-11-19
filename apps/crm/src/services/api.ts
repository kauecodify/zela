import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

// Configuracoes base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001'
const ROUTING_SERVICE_URL = process.env.NEXT_PUBLIC_ROUTING_URL || 'http://localhost:3002'
const ANALYTICS_SERVICE_URL = process.env.NEXT_PUBLIC_ANALYTICS_URL || 'http://localhost:3010'
const POOL_SERVICE_URL = process.env.NEXT_PUBLIC_POOL_URL || 'http://localhost:3013'

// Criar instancia do axios para o Kong Gateway
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Criar instancias para servicos específicos
const authApi: AxiosInstance = axios.create({
  baseURL: AUTH_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const routingApi: AxiosInstance = axios.create({
  baseURL: ROUTING_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const analyticsApi: AxiosInstance = axios.create({
  baseURL: ANALYTICS_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const poolApi: AxiosInstance = axios.create({
  baseURL: POOL_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Adicionar token de autenticacao nas requisicoes
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('zela_access_token') : null
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

// Adicionar token de autenticacao para o auth service
authApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('zela_access_token') : null
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

// Adicionar token de autenticacao para o routing service
routingApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('zela_access_token') : null
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

// Adicionar token de autenticacao para o analytics service
analyticsApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('zela_access_token') : null
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

// Adicionar token de autenticacao para o pool service
poolApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('zela_access_token') : null
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

// Tratar erros de autenticacao
const handleAuthError = (error: AxiosError) => {
  if (error.response?.status === 401) {
    // Token expirou ou invalido
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zela_access_token')
      localStorage.removeItem('zela_refresh_token')
      localStorage.removeItem('zela_user')
    }
  }
  
  return Promise.reject(error)
}

// Aplicar interceptor de erro para todas as instancias
const applyErrorInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response) => response,
    handleAuthError
  )
}

applyErrorInterceptors(api)
applyErrorInterceptors(authApi)
applyErrorInterceptors(routingApi)
applyErrorInterceptors(analyticsApi)
applyErrorInterceptors(poolApi)

export { api, authApi, routingApi, analyticsApi, poolApi }

export default api
