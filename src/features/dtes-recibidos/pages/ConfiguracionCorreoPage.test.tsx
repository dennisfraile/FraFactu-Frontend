// src/features/dtes-recibidos/pages/ConfiguracionCorreoPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { ConfiguracionCorreoPage } from './ConfiguracionCorreoPage'
import { authAs } from '@/test/auth'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ToastProvider><MemoryRouter><ConfiguracionCorreoPage /></MemoryRouter></ToastProvider></QueryClientProvider>)
}

describe('ConfiguracionCorreoPage', () => {
  beforeEach(() => {
    authAs('EmisorAdmin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
  })

  it('muestra el estado desconectado y el botón de conectar', async () => {
    setup()
    expect(await screen.findByText(/no conectado/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /conectar gmail/i })).toBeInTheDocument()
  })
})
