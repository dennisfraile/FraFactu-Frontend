export interface LoginResponse {
  token: string
  tokenType: string
  expiresIn: number
  userId: number
  nombreCompleto: string
  email: string
  rolId: number
  rolNombre: string
  emisorId: number | null
  emisorNombre: string | null
  accesoTodasSucursales: boolean
  sucursalIds: number[]
  permisos: string[]
  requiereCambioPwd: boolean
}

export interface AuthUser {
  userId: number
  nombreCompleto: string
  email: string
  rolId: number
  rolNombre: string
  emisorId: number | null
  emisorNombre: string | null
  accesoTodasSucursales: boolean
  sucursalIds: number[]
  permisos: string[]
}
