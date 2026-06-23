import axios from 'axios'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/app/auth-store'

export const api = axios.create({ baseURL: `${env.apiUrl}/api` })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    if (status === 401 || status === 403) {
      useAuthStore.getState().logout()
      // Respaldo duro fuera del árbol de React Router.
      try {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.assign('/login?expirada=1')
        }
      } catch {
        // jsdom no implementa window.location.assign; ignorar en tests.
      }
    }
    return Promise.reject(error)
  },
)
