import { useMemo, useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'
import { useActividadesEconomicas, useTiposDocumentoReceptor, useDepartamentos, useMunicipios, useDistritos, useCrearReceptor } from '../hooks'
import type { ReceptorPolicy } from '../dte/strategy'
import type { CrearReceptorDto, ReceptorListItem } from '../types'

interface Props {
  policy: Extract<ReceptorPolicy, 'contribuyente' | 'sujetoExcluido'>
  onCreated: (r: ReceptorListItem) => void
  onClose: () => void
}

export function ReceptorFormModal({ policy, onCreated, onClose }: Props) {
  const tiposDoc = useTiposDocumentoReceptor()
  const actividades = useActividadesEconomicas()
  const departamentos = useDepartamentos()
  const municipios = useMunicipios()
  const distritos = useDistritos()
  const crear = useCrearReceptor()

  const [catTipoDocumentoId, setCatTipoDocumentoId] = useState<number | null>(null)
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [nombreRazonSocial, setNombreRazonSocial] = useState('')
  const [nrc, setNrc] = useState('')
  const [codigoActividad, setCodigoActividad] = useState('')
  const [catDepartamentoId, setCatDepartamentoId] = useState<number | null>(null)
  const [catMunicipioId, setCatMunicipioId] = useState<number | null>(null)
  const [catDistritoId, setCatDistritoId] = useState<number | null>(null)
  const [direccion, setDireccion] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [error, setError] = useState<string | null>(null)

  const esContribuyente = policy === 'contribuyente'

  // Cascada: filtra municipios por departamento y distritos por departamento+municipio.
  // departamentos.data es CatalogoItem[] (campo: codigo), municipios/distritos tienen codigoDepartamento/codigoMunicipio.
  const deptoCodigo = departamentos.data?.find((d) => d.id === catDepartamentoId)?.codigo
  const muniCodigo = municipios.data?.find((m) => m.id === catMunicipioId)?.codigo
  const municipiosFiltrados = useMemo(
    () => (municipios.data ?? []).filter((m) => !deptoCodigo || m.codigoDepartamento === deptoCodigo),
    [municipios.data, deptoCodigo],
  )
  const distritosFiltrados = useMemo(
    () => (distritos.data ?? []).filter((d) => (!deptoCodigo || d.codigoDepartamento === deptoCodigo) && (!muniCodigo || d.codigoMunicipio === muniCodigo)),
    [distritos.data, deptoCodigo, muniCodigo],
  )
  const seleccionables = (actividades.data ?? []).filter((a) => a.esSeleccionable)
  const actividadSel = seleccionables.find((a) => a.codigo === codigoActividad)

  const validar = (): string | null => {
    if (nombreRazonSocial.trim().length < 3) return 'Razón social requerida (mín. 3 caracteres)'
    if (esContribuyente && !nrc.trim()) return 'El NRC es obligatorio para un contribuyente (CCF)'
    if (!catTipoDocumentoId) return 'Seleccione el tipo de documento'
    if (!numeroDocumento.trim()) return 'El número de documento es obligatorio'
    if (!codigoActividad) return 'La actividad económica es obligatoria'
    if (!catDepartamentoId || !catMunicipioId) return 'Seleccione departamento y municipio'
    if (direccion.trim().length < 5) return 'La dirección (complemento) es obligatoria'
    return null
  }

  const guardar = async () => {
    const err = validar()
    if (err) { setError(err); return }
    setError(null)
    const dto: CrearReceptorDto = {
      catTipoDocumentoId,
      numeroDocumento: numeroDocumento.trim() || undefined,
      nombreRazonSocial: nombreRazonSocial.trim(),
      nrc: nrc.trim() || undefined,
      codigoActividad: codigoActividad || undefined,
      descripcionActividad: actividadSel?.valor,
      catDepartamentoId,
      catMunicipioId,
      catDistritoId,
      direccion: direccion.trim() || undefined,
      correoElectronico: correo.trim() || undefined,
      telefono: telefono.trim() || undefined,
    }
    try {
      const r = await crear.mutateAsync(dto)
      const tipoDocNombre = tiposDoc.data?.find((t) => t.id === catTipoDocumentoId)?.valor ?? ''
      onCreated({
        id: r.id,
        tipoDocumentoNombre: tipoDocNombre,
        numeroDocumento: r.numeroDocumento,
        nombreRazonSocial: r.nombreRazonSocial,
        correoElectronico: r.correoElectronico ?? '',
        nrc: r.nrc ?? '',
      })
    } catch {
      setError('No se pudo crear el receptor')
    }
  }

  const titulo = esContribuyente ? 'Nuevo receptor (contribuyente)' : 'Nuevo sujeto excluido'

  return (
    <Modal open onClose={onClose} title={titulo}>
      <div className="space-y-3">
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <FormField label="Nombre o razón social" htmlFor="r-nombre">
          <Input id="r-nombre" value={nombreRazonSocial} onChange={(e) => setNombreRazonSocial(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Tipo de documento" htmlFor="r-tipodoc">
            <select id="r-tipodoc" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
              value={catTipoDocumentoId ?? ''} onChange={(e) => setCatTipoDocumentoId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Seleccione…</option>
              {(tiposDoc.data ?? [])
                .filter((t) => esContribuyente || t.codigo !== '36') // FSE: el sujeto excluido no usa NIT.
                .map((t) => <option key={t.id} value={t.id}>{t.valor}</option>)}
            </select>
          </FormField>
          <FormField label="Número de documento" htmlFor="r-numdoc">
            <Input id="r-numdoc" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} />
          </FormField>
        </div>
        {esContribuyente && (
          <FormField label="NRC" htmlFor="r-nrc">
            <Input id="r-nrc" value={nrc} onChange={(e) => setNrc(e.target.value)} />
          </FormField>
        )}
        <FormField label="Actividad económica" htmlFor="r-act">
          <select id="r-act" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
            value={codigoActividad} onChange={(e) => setCodigoActividad(e.target.value)}>
            <option value="">Seleccione…</option>
            {seleccionables.map((a) => <option key={a.id} value={a.codigo}>{a.codigo} — {a.valor}</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-3 gap-2">
          <FormField label="Departamento" htmlFor="r-depto">
            <select id="r-depto" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
              value={catDepartamentoId ?? ''} onChange={(e) => { setCatDepartamentoId(e.target.value ? Number(e.target.value) : null); setCatMunicipioId(null); setCatDistritoId(null) }}>
              <option value="">…</option>
              {(departamentos.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.valor}</option>)}
            </select>
          </FormField>
          <FormField label="Municipio" htmlFor="r-muni">
            <select id="r-muni" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
              value={catMunicipioId ?? ''} onChange={(e) => { setCatMunicipioId(e.target.value ? Number(e.target.value) : null); setCatDistritoId(null) }}>
              <option value="">…</option>
              {municipiosFiltrados.map((m) => <option key={m.id} value={m.id}>{m.valor}</option>)}
            </select>
          </FormField>
          <FormField label="Distrito (opcional)" htmlFor="r-dist">
            <select id="r-dist" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
              value={catDistritoId ?? ''} onChange={(e) => setCatDistritoId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">…</option>
              {distritosFiltrados.map((d) => <option key={d.id} value={d.id}>{d.valor}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Dirección (complemento)" htmlFor="r-dir">
          <Input id="r-dir" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Correo (opcional)" htmlFor="r-correo">
            <Input id="r-correo" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </FormField>
          <FormField label="Teléfono (opcional)" htmlFor="r-tel">
            <Input id="r-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={crear.isPending}>{crear.isPending ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </Modal>
  )
}
