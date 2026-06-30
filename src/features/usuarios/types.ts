export interface PaginatedResponse<T> {
  items: T[]
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
}

export interface SucursalAsignada { id: number; nombre: string }
export interface CajaAsignada { id: number; nombre: string; sucursalNombre?: string | null }

export interface UsuarioListDto {
  id: number
  nombreCompleto: string
  email: string
  activo: boolean
  rolId: number
  rolNombre: string
  emisorNombre: string
  accesoTodasSucursales: boolean
  cantidadSucursales: number
  sucursalesNombres: string
  sucursalIds: number[]
  cajas?: CajaAsignada[]
  fechaCreacion: string
  ultimoAcceso: string | null
}

export interface UsuarioDto {
  id: number
  nombreCompleto: string
  email: string
  requiereCambioPwd: boolean
  permiteCambioPwd: boolean
  activo: boolean
  fechaCreacion: string
  emisorId: number
  emisorNombre: string
  rolId: number
  rolNombre: string
  accesoTodasSucursales: boolean
  sucursales: SucursalAsignada[]
  cajas: CajaAsignada[]
  ultimoAcceso: string | null
}

export interface Rol { id: number; nombre: string }
export interface CajaUsuario { id: number; nombre: string; sucursalId: number; codigo: string }

export interface CrearUsuarioDto {
  nombreCompleto: string
  email: string
  password?: string
  requiereCambioPwd: boolean
  rolId: number
  accesoTodasSucursales: boolean
  sucursalIds: number[]
  cajaIds: number[]
}

export interface ActualizarUsuarioDto {
  nombreCompleto: string
  email: string
  activo: boolean
  rolId: number
  accesoTodasSucursales: boolean
  sucursalIds: number[]
  cajaIds: number[]
  requiereCambioPwd: boolean
  password?: string
}

export interface ListarUsuariosParams {
  pageNumber: number
  pageSize: number
  searchTerm?: string
  soloActivos?: boolean
}
