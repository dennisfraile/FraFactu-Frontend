// src/features/compras/catalogos-api.ts
import { api } from '@/lib/http/axios'
import type { PagedResult, TipoGastoDto } from './types'

export const tiposGastoApi = {
  async listar(): Promise<TipoGastoDto[]> {
    const { data } = await api.get<PagedResult<TipoGastoDto>>('/tiposgasto', {
      params: { page: 1, pageSize: 100, soloActivos: true },
    })
    return data.items
  },
}

// Catálogos compartidos con facturación (no se duplican).
export { productosApi, bodegasApi, sucursalesApi } from '@/features/facturacion/catalogos-api'
