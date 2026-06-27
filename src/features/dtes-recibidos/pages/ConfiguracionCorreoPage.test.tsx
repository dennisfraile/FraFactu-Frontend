// src/features/dtes-recibidos/pages/ConfiguracionCorreoPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { ConfiguracionCorreoPage } from './ConfiguracionCorreoPage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ToastProvider><MemoryRouter><ConfiguracionCorreoPage /></MemoryRouter></ToastProvider></QueryClientProvider>)
}

describe('ConfiguracionCorreoPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('muestra el estado desconectado y el botón de conectar', async () => {
    setup()
    expect(await screen.findByText(/no conectado/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /conectar gmail/i })).toBeInTheDocument()
  })
})
