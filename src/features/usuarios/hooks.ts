import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usuariosApi, rolesApi, cajasApi } from './api'
import type { ListarUsuariosParams, CrearUsuarioDto, ActualizarUsuarioDto } from './types'

const HORA = 1000 * 60 * 60

export function useUsuarios(params: ListarUsuariosParams) {
  return useQuery({ queryKey: ['usuarios', params], queryFn: () => usuariosApi.listar(params) })
}
export function useUsuario(id: number) {
  return useQuery({ queryKey: ['usuario', id], queryFn: () => usuariosApi.getById(id), enabled: Number.isFinite(id) && id > 0 })
}
export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: () => rolesApi.listar(), staleTime: HORA })
}
export function useCajasUsuarios() {
  return useQuery({ queryKey: ['cajas-todas'], queryFn: () => cajasApi.listarTodas(), staleTime: HORA })
}
export function useCrearUsuario() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (dto: CrearUsuarioDto) => usuariosApi.crear(dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }) })
}
export function useActualizarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ActualizarUsuarioDto }) => usuariosApi.actualizar(id, dto),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ['usuarios'] }); qc.invalidateQueries({ queryKey: ['usuario', v.id] }) },
  })
}
export function useToggleUsuario() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: number) => usuariosApi.toggleActive(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }) })
}
export function useEliminarUsuario() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: number) => usuariosApi.eliminar(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }) })
}
