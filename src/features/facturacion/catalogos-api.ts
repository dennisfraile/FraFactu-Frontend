// src/features/facturacion/catalogos-api.ts
import { api } from '@/lib/http/axios'
import type {
  CatalogoItem, MunicipioItem, DistritoItem, ReceptorListItem, ProductoListItem, Vendedor, Sucursal,
} from './types'

// Mapa de nombre lógico → segmento real del endpoint /api/catalogos/*.
const CATALOGO_PATHS = {
  departamentos: 'departamentos',
  municipios: 'municipios',
  distritos: 'distritos',
  tributos: 'tributos',
  unidadesMedida: 'unidades-medida',
  tiposItems: 'tipos-items',
  formasPago: 'formas-pago',
  condicionesOperacion: 'condiciones-operacione', // sic: typo del backend
  tiposDocIdentificacion: 'tipos-documento-identificacion-receptor',
  plazos: 'plazos',
} as const

export type NombreCatalogo = keyof typeof CATALOGO_PATHS

export const catalogosApi = {
  async get<T = CatalogoItem>(nombre: NombreCatalogo): Promise<T[]> {
    const { data } = await api.get<T[]>(`/catalogos/${CATALOGO_PATHS[nombre]}`)
    return data
  },
  municipios(): Promise<MunicipioItem[]> { return this.get<MunicipioItem>('municipios') },
  distritos(): Promise<DistritoItem[]> { return this.get<DistritoItem>('distritos') },
}

export const receptoresApi = {
  async search(searchTerm: string): Promise<ReceptorListItem[]> {
    const { data } = await api.get<ReceptorListItem[]>('/receptores/search', { params: { searchTerm } })
    return data
  },
}

export const productosApi = {
  async search(searchTerm: string, sucursalId?: number): Promise<ProductoListItem[]> {
    const { data } = await api.get<ProductoListItem[]>('/productosservicios/search', {
      params: { searchTerm, sucursalId },
    })
    return data
  },
}

export const vendedoresApi = {
  async listar(sucursalId?: number): Promise<Vendedor[]> {
    const { data } = await api.get<Vendedor[]>('/vendedores', { params: { activeOnly: true, sucursalId } })
    return data
  },
}

export const sucursalesApi = {
  async todasActivas(): Promise<Sucursal[]> {
    const { data } = await api.get<Sucursal[]>('/sucursales/todas-activas')
    return data
  },
}
