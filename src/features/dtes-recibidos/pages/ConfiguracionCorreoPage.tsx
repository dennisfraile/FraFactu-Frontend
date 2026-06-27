// src/features/dtes-recibidos/pages/ConfiguracionCorreoPage.tsx
import { Button, Spinner, useToast } from '@/design-system'
import { useMiPerfil, useGmailConnect, useGmailDisconnect, useProbarConexion, useConfigurarLectura } from '../hooks'

export function ConfiguracionCorreoPage() {
  const toast = useToast()
  const perfil = useMiPerfil()
  const connect = useGmailConnect()
  const disconnect = useGmailDisconnect()
  const probar = useProbarConexion()
  const configurar = useConfigurarLectura()

  if (perfil.isLoading) return <div className="p-6"><Spinner /></div>

  const conectado = perfil.data?.gmailConectado ?? false
  const email = perfil.data?.gmailEmail
  const lecturaHabilitada = perfil.data?.lecturaCorreoHabilitada ?? false

  const onConectar = async () => {
    try {
      const { authorizationUrl } = await connect.mutateAsync()
      window.open(authorizationUrl, '_blank', 'noopener')
      toast.show('Autoriza el acceso en la ventana de Google; al volver, prueba la conexión.')
    } catch {
      toast.show('No se pudo iniciar la conexión con Gmail', { tone: 'rojo' })
    }
  }
  const onDesconectar = async () => {
    try { await disconnect.mutateAsync(); toast.show('Gmail desconectado') }
    catch { toast.show('No se pudo desconectar', { tone: 'rojo' }) }
  }
  const onProbar = async () => {
    try { const r = await probar.mutateAsync(); toast.show(r.mensaje, r.exitoso ? undefined : { tone: 'rojo' }) }
    catch { toast.show('No se pudo probar la conexión', { tone: 'rojo' }) }
  }
  const onToggle = async (habilitar: boolean) => {
    try { await configurar.mutateAsync({ lecturaCorreoHabilitada: habilitar }); toast.show('Configuración actualizada') }
    catch { toast.show('No se pudo actualizar la configuración', { tone: 'rojo' }) }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-semibold text-ink">Configuración de lectura de correo</h1>

      <div className="rounded-xl border border-hairline p-4">
        <p className="text-sm text-slate">Estado de Gmail</p>
        <p className="mt-1 text-base font-medium text-ink">{conectado ? `Conectado (${email})` : 'No conectado'}</p>
        <div className="mt-3 flex gap-2">
          {!conectado && <Button onClick={onConectar} disabled={connect.isPending}>Conectar Gmail</Button>}
          {conectado && <Button variant="ghost" onClick={onProbar} disabled={probar.isPending}>Probar conexión</Button>}
          {conectado && <Button variant="danger" onClick={onDesconectar} disabled={disconnect.isPending}>Desconectar</Button>}
        </div>
      </div>

      <div className="rounded-xl border border-hairline p-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={lecturaHabilitada} onChange={(e) => onToggle(e.target.checked)} disabled={configurar.isPending} />
          Habilitar lectura automática de DTEs desde correo
        </label>
      </div>
    </div>
  )
}
