// src/features/compras/components/ProveedorFormModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'
import { useCrearProveedor, useActualizarProveedor } from '../hooks'
import { proveedorSchema } from '../schemas'
import type { ProveedorDto, CrearProveedorDto } from '../types'

interface Props {
  proveedor?: ProveedorDto | null
  onSaved: (p: ProveedorDto) => void
  onClose: () => void
}

export function ProveedorFormModal({ proveedor, onSaved, onClose }: Props) {
  const editando = !!proveedor
  const crear = useCrearProveedor()
  const actualizar = useActualizarProveedor()

  const [nit, setNit] = useState(proveedor?.nit ?? '')
  const [nombre, setNombre] = useState(proveedor?.nombre ?? '')
  const [nombreComercial, setNombreComercial] = useState(proveedor?.nombreComercial ?? '')
  const [direccion, setDireccion] = useState(proveedor?.direccion ?? '')
  const [telefono, setTelefono] = useState(proveedor?.telefono ?? '')
  const [email, setEmail] = useState(proveedor?.email ?? '')
  const [contacto, setContacto] = useState(proveedor?.contacto ?? '')
  const [sitioWeb, setSitioWeb] = useState(proveedor?.sitioWeb ?? '')
  const [notas, setNotas] = useState(proveedor?.notas ?? '')
  const [error, setError] = useState<string | null>(null)

  const guardar = async () => {
    const valores = { nit, nombre, nombreComercial: nombreComercial ?? '', direccion: direccion ?? '', telefono: telefono ?? '', email: email ?? '', contacto: contacto ?? '', sitioWeb: sitioWeb ?? '', notas: notas ?? '' }
    const res = proveedorSchema.safeParse(valores)
    if (!res.success) { setError(res.error.issues[0]?.message ?? 'Revise el formulario'); return }
    setError(null)
    // El backend trata '' como ausente; enviamos undefined en los opcionales vacíos.
    const limpio = (s: string) => (s.trim() ? s.trim() : undefined)
    const dto: CrearProveedorDto = {
      nit: nit.trim(),
      nombre: nombre.trim(),
      nombreComercial: limpio(nombreComercial ?? ''),
      direccion: limpio(direccion ?? ''),
      telefono: limpio(telefono ?? ''),
      email: limpio(email ?? ''),
      contacto: limpio(contacto ?? ''),
      sitioWeb: limpio(sitioWeb ?? ''),
      notas: limpio(notas ?? ''),
    }
    try {
      const p = editando
        ? await actualizar.mutateAsync({ id: proveedor!.id, dto: { ...dto, activo: proveedor!.activo } })
        : await crear.mutateAsync(dto)
      onSaved(p)
    } catch {
      setError('No se pudo guardar el proveedor')
    }
  }

  const guardando = crear.isPending || actualizar.isPending

  return (
    <Modal open onClose={onClose} title={editando ? 'Editar proveedor' : 'Nuevo proveedor'}>
      <div className="space-y-3">
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <FormField label="NIT" htmlFor="p-nit">
            <Input id="p-nit" value={nit} onChange={(e) => setNit(e.target.value)} placeholder="14 dígitos" />
          </FormField>
          <FormField label="Nombre o razón social" htmlFor="p-nombre">
            <Input id="p-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Nombre comercial (opcional)" htmlFor="p-comercial">
            <Input id="p-comercial" value={nombreComercial ?? ''} onChange={(e) => setNombreComercial(e.target.value)} />
          </FormField>
          <FormField label="Contacto (opcional)" htmlFor="p-contacto">
            <Input id="p-contacto" value={contacto ?? ''} onChange={(e) => setContacto(e.target.value)} />
          </FormField>
        </div>
        <FormField label="Dirección (opcional)" htmlFor="p-dir">
          <Input id="p-dir" value={direccion ?? ''} onChange={(e) => setDireccion(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-3 gap-2">
          <FormField label="Teléfono (opcional)" htmlFor="p-tel">
            <Input id="p-tel" value={telefono ?? ''} onChange={(e) => setTelefono(e.target.value)} />
          </FormField>
          <FormField label="Correo (opcional)" htmlFor="p-email">
            <Input id="p-email" value={email ?? ''} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <FormField label="Sitio web (opcional)" htmlFor="p-web">
            <Input id="p-web" value={sitioWeb ?? ''} onChange={(e) => setSitioWeb(e.target.value)} />
          </FormField>
        </div>
        <FormField label="Notas (opcional)" htmlFor="p-notas">
          <Input id="p-notas" value={notas ?? ''} onChange={(e) => setNotas(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </Modal>
  )
}
