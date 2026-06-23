import { api } from '@/lib/http/axios'
import type { LoginResponse } from './types'

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
    return data
  },
  async googleLogin(accessToken: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/google', { accessToken })
    return data
  },
  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email })
  },
  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword, confirmPassword })
  },
  async changePasswordFirstLogin(newPassword: string, confirmPassword: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/change-password-first-login', { newPassword, confirmPassword })
    return data
  },
  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },
}
