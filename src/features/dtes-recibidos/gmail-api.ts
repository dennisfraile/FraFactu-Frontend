// src/features/dtes-recibidos/gmail-api.ts
import { api } from '@/lib/http/axios'
import type { EmisorPerfilGmail } from './types'

export const gmailApi = {
  async connect(): Promise<{ authorizationUrl: string }> {
    const { data } = await api.get<{ authorizationUrl: string }>('/emisores/gmail-connect')
    return data
  },
  async exchangeCode(code: string, state: string): Promise<{ success: boolean; email: string }> {
    const { data } = await api.post<{ success: boolean; email: string }>('/emisores/gmail-exchange-code', { code, state })
    return data
  },
  async disconnect(): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>('/emisores/gmail-disconnect')
    return data
  },
}

export const emisorPerfilApi = {
  async miPerfil(): Promise<EmisorPerfilGmail> {
    const { data } = await api.get<EmisorPerfilGmail>('/emisores/mi-perfil')
    return data
  },
}
