import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/design-system'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

// Boundary de render: evita que una excepción en cualquier página tumbe toda la
// SPA a pantalla en blanco (crítico si el usuario está a mitad de emitir un DTE).
// Se coloca alrededor del <Outlet/> en AppLayout, dentro del contenedor keyed por
// pathname, de modo que al navegar a otra ruta el boundary se reinicia solo.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Deja rastro en consola para diagnóstico; en producción aquí iría el envío
    // a un servicio de errores si se incorpora uno más adelante.
    console.error('ErrorBoundary capturó un error de render:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-md py-16 text-center">
          <h1 className="text-lg font-semibold text-ink">Algo salió mal</h1>
          <p className="mt-2 text-sm text-slate">
            Ocurrió un error inesperado al mostrar esta sección. Puedes recargar la página e intentarlo de nuevo.
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Recargar la página
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
