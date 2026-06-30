import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'
import { useRoles, useCajasUsuarios } from '../hooks'
import { useSucursales } from '@/features/facturacion/hooks'
import { crearUsuarioSchema, actualizarUsuarioSchema, toCrearDto, toActualizarDto } from '../schemas'
import type { UsuarioDto, CrearUsuarioDto, ActualizarUsuarioDto } from '../types'

interface Props {
  inicial?: UsuarioDto | null
  onGuardarCrear: (dto: CrearUsuarioDto) => void
  onGuardarEditar: (id: number, dto: ActualizarUsuarioDto) => void
  onClose: () => void
  cargando: boolean
}

export function UsuarioFormModal({ inicial, onGuardarCrear, onGuardarEditar, onClose, cargando }: Props) {
  return (
    <Modal open onClose={onClose} title={inicial ? 'Editar usuario' : 'Nuevo usuario'}>
      <UsuarioFormInner
        key={inicial?.id ?? 'nuevo'}
        inicial={inicial}
        onGuardarCrear={onGuardarCrear}
        onGuardarEditar={onGuardarEditar}
        onClose={onClose}
        cargando={cargando}
      />
    </Modal>
  )
}

function UsuarioFormInner({ inicial, onGuardarCrear, onGuardarEditar, onClose, cargando }: Props) {
  const esEdicion = !!inicial
  const roles = useRoles()
  const sucursales = useSucursales()

  const [nombreCompleto, setNombre] = useState(inicial?.nombreCompleto ?? '')
  const [email, setEmail] = useState(inicial?.email ?? '')
  const [rolId, setRolId] = useState<number>(inicial?.rolId ?? 0)
  const [activo, setActivo] = useState(inicial?.activo ?? true)
  const [accesoTodas, setAccesoTodas] = useState(inicial?.accesoTodasSucursales ?? true)
  const [sucursalIds, setSucursalIds] = useState<number[]>(inicial?.sucursales.map((s) => s.id) ?? [])
  const [cajaIds, setCajaIds] = useState<number[]>(inicial?.cajas.map((c) => c.id) ?? [])
  const [modoPassword, setModoPassword] = useState<'correo' | 'manual'>('correo')
  const [resetPassword, setResetPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [requiereCambioPwd, setRequiere] = useState(esEdicion ? (inicial?.requiereCambioPwd ?? false) : true)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const rolSeleccionado = roles.data?.find((r) => r.id === rolId)
  const esCajero = rolSeleccionado?.nombre === 'Cajero'

  const cajas = useCajasUsuarios(esCajero)

  const toggleEn = (arr: number[], id: number) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id])

  const guardar = () => {
    setErrores({})
    if (esEdicion && inicial) {
      const form = { nombreCompleto, email, rolId, activo, accesoTodasSucursales: accesoTodas, sucursalIds, cajaIds: esCajero ? cajaIds : [], requiereCambioPwd, resetPassword, password, confirmar }
      const res = actualizarUsuarioSchema.safeParse(form)
      if (!res.success) { setErrores(mapErrores(res.error)); return }
      onGuardarEditar(inicial.id, toActualizarDto(res.data))
    } else {
      const form = { nombreCompleto, email, rolId, accesoTodasSucursales: accesoTodas, sucursalIds, cajaIds: esCajero ? cajaIds : [], modoPassword, password, confirmar, requiereCambioPwd }
      const res = crearUsuarioSchema.safeParse(form)
      if (!res.success) { setErrores(mapErrores(res.error)); return }
      onGuardarCrear(toCrearDto(res.data))
    }
  }

  return (
    <div className="space-y-3">
      <FormField label="Nombre completo" htmlFor="u-nombre" error={errores.nombreCompleto}>
        <Input id="u-nombre" value={nombreCompleto} onChange={(e) => setNombre(e.target.value)} />
      </FormField>
      <FormField label="Email" htmlFor="u-email" error={errores.email}>
        <Input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>
      <FormField label="Rol" htmlFor="u-rol" error={errores.rolId}>
        <select id="u-rol" className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-sm" value={rolId} onChange={(e) => setRolId(Number(e.target.value))}>
          <option value={0}>Seleccione…</option>
          {roles.data?.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
      </FormField>

      <FormField label="Sucursales" htmlFor="u-sucs" error={errores.sucursalIds}>
        <div id="u-sucs" className="space-y-1">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={accesoTodas} onChange={(e) => setAccesoTodas(e.target.checked)} />
            Acceso a todas las sucursales
          </label>
          {!accesoTodas && sucursales.data?.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sucursalIds.includes(s.id)} onChange={() => setSucursalIds((a) => toggleEn(a, s.id))} />
              {s.nombre}
            </label>
          ))}
          {accesoTodas && sucursales.data?.map((s) => (
            <span key={s.id} className="text-sm text-slate/70">{s.nombre}</span>
          ))}
        </div>
      </FormField>

      {esCajero && (
        <FormField label="Cajas asignadas" htmlFor="u-cajas">
          <div id="u-cajas" className="space-y-1">
            {cajas.data?.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cajaIds.includes(c.id)} onChange={() => setCajaIds((a) => toggleEn(a, c.id))} />
                {c.nombre}
              </label>
            ))}
          </div>
        </FormField>
      )}

      {!esEdicion && (
        <fieldset className="space-y-2 rounded-md border border-hairline p-3">
          <legend className="px-1 text-xs uppercase tracking-wide text-slate">Contraseña</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="modo-pwd" checked={modoPassword === 'correo'} onChange={() => setModoPassword('correo')} />
            Enviar clave temporal por correo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="modo-pwd" checked={modoPassword === 'manual'} onChange={() => setModoPassword('manual')} />
            Fijar contraseña ahora
          </label>
          {modoPassword === 'manual' && (
            <>
              <FormField label="Contraseña" htmlFor="u-pwd" error={errores.password}>
                <Input id="u-pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </FormField>
              <FormField label="Confirmar contraseña" htmlFor="u-pwd2" error={errores.confirmar}>
                <Input id="u-pwd2" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
              </FormField>
            </>
          )}
        </fieldset>
      )}

      {esEdicion && (
        <>
          <FormField label="Estado" htmlFor="u-activo">
            <select id="u-activo" className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-sm" value={activo ? '1' : '0'} onChange={(e) => setActivo(e.target.value === '1')}>
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </FormField>
          <fieldset className="space-y-2 rounded-md border border-hairline p-3">
            <legend className="px-1 text-xs uppercase tracking-wide text-slate">Contraseña</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={resetPassword} onChange={(e) => setResetPassword(e.target.checked)} />
              Resetear contraseña
            </label>
            {resetPassword && (
              <>
                <FormField label="Nueva contraseña" htmlFor="u-rpwd" error={errores.password}>
                  <Input id="u-rpwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </FormField>
                <FormField label="Confirmar contraseña" htmlFor="u-rpwd2" error={errores.confirmar}>
                  <Input id="u-rpwd2" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
                </FormField>
              </>
            )}
          </fieldset>
        </>
      )}

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={requiereCambioPwd} onChange={(e) => setRequiere(e.target.checked)} />
        Requiere cambio de contraseña en el próximo ingreso
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={guardar} disabled={cargando}>{cargando ? 'Guardando…' : 'Guardar'}</Button>
      </div>
    </div>
  )
}

function mapErrores(err: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? '_')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
