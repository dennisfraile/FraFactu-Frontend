import { http, HttpResponse } from 'msw'
import type { UsuarioListDto, UsuarioDto } from '@/features/usuarios/types'

const base = 'http://localhost:8080/api'

export const usuarioListaEjemplo: UsuarioListDto = {
  id: 1, nombreCompleto: 'Ana Pérez', email: 'ana@x.com', activo: true, rolId: 5, rolNombre: 'EmisorAdmin',
  emisorNombre: 'Empresa E2E', accesoTodasSucursales: true, cantidadSucursales: 1, sucursalesNombres: 'Casa Matriz',
  sucursalIds: [2], cajas: [], fechaCreacion: '2026-06-30', ultimoAcceso: null,
}
export const usuarioDetalleEjemplo: UsuarioDto = {
  id: 1, nombreCompleto: 'Ana Pérez', email: 'ana@x.com', requiereCambioPwd: false, permiteCambioPwd: true,
  activo: true, fechaCreacion: '2026-06-30', emisorId: 3, emisorNombre: 'Empresa E2E', rolId: 5, rolNombre: 'EmisorAdmin',
  accesoTodasSucursales: true, sucursales: [{ id: 2, nombre: 'Casa Matriz' }], cajas: [], ultimoAcceso: null,
}
export const rolesEjemplo = [
  { id: 1, nombre: 'SuperAdmin' }, { id: 5, nombre: 'EmisorAdmin' }, { id: 6, nombre: 'GerenteSucursal' },
  { id: 7, nombre: 'Cajero' }, { id: 8, nombre: 'Auditor' }, { id: 9, nombre: 'Contador' },
]
export const cajasEjemplo = [{ id: 1, nombre: 'Caja Principal', sucursalId: 2, codigo: 'C1' }]

const page = (item: UsuarioListDto) => ({ items: [item], currentPage: 1, totalPages: 1, pageSize: 10, totalCount: 1 })

export const usuariosHandlers = [
  http.get(`${base}/usuarios`, () => HttpResponse.json(page(usuarioListaEjemplo))),
  http.get(`${base}/usuarios/1`, () => HttpResponse.json(usuarioDetalleEjemplo)),
  http.post(`${base}/usuarios`, () => HttpResponse.json({ ...usuarioDetalleEjemplo, id: 2 }, { status: 201 })),
  http.put(`${base}/usuarios/:id`, () => HttpResponse.json(usuarioDetalleEjemplo)),
  http.patch(`${base}/usuarios/:id/toggle-active`, () => HttpResponse.json({ activo: false })),
  http.delete(`${base}/usuarios/:id`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${base}/roles`, () => HttpResponse.json(rolesEjemplo)),
  http.get(`${base}/cajas`, () => HttpResponse.json(cajasEjemplo)),
]
