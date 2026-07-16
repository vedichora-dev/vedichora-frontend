import axios from 'axios'
import { AUTH_URL, CHART_URL } from '@/lib/constants'

export const authApi = axios.create({
  baseURL: AUTH_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const chartApi = axios.create({
  baseURL: CHART_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every chart request
chartApi.interceptors.request.use(cfg => {
  const token = localStorage.getItem('vh_token')
  if (token) cfg.headers!['Authorization'] = `Bearer ${token}`
  return cfg
})

// Auto-refresh on 401
chartApi.interceptors.response.use(
  r => r,
  async err => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem('vh_refresh')
      if (refresh) {
        try {
          const res = await authApi.post('/api/auth/refresh', { refreshToken: refresh })
          const newToken = res.data?.data?.accessToken
          if (newToken) {
            localStorage.setItem('vh_token', newToken)
            err.config.headers['Authorization'] = `Bearer ${newToken}`
            return chartApi.request(err.config)
          }
        } catch {}
      }
      localStorage.clear()
      window.location.href = '/signin'
    }
    return Promise.reject(err)
  }
)

// Helper — unwraps ApiResponse<T> wrapper
export async function apiGet<T>(url: string): Promise<T | null> {
  try {
    const res = await chartApi.get(url)
    return (res.data?.data ?? res.data) as T
  } catch { return null }
}

export async function apiPost<T>(url: string, body: unknown, useAuth = true): Promise<T | null> {
  try {
    const client = useAuth ? chartApi : authApi
    const res = await client.post(url, body)
    return (res.data?.data ?? res.data) as T
  } catch { return null }
}
