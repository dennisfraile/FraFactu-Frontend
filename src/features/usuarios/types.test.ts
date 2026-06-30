import { describe, it, expect } from 'vitest'
import type { UsuarioListDto, CrearUsuarioDto } from './types'

describe('tipos usuarios', () => {
  it('UsuarioListDto y CrearUsuarioDto compilan con la forma esperada', () => {
    const u: UsuarioListDto = {
      id: 1, nombreCompleto: 'Ana', email: 'a@x.com', activo: true, rolId: 5, rolNombre: 'EmisorAdmin',
      emisorNombre: 'E', accesoTodasSucursales: true, cantidadSucursales: 1, sucursalesNombres: 'Casa Matriz',
      sucursalIds: [2], fechaCreacion: '2026-06-30', ultimoAcceso: null,
    }
    const dto: CrearUsuarioDto = {
      nombreCompleto: 'Ana', email: 'a@x.com', rolId: 5, accesoTodasSucursales: true,
      sucursalIds: [], cajaIds: [], requiereCambioPwd: false,
    }
    expect(u.id).toBe(1)
    expect(dto.rolId).toBe(5)
  })
})
