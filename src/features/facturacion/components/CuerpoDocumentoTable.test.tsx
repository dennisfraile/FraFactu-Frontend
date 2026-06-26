import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactElement } from 'react'
import { CuerpoDocumentoTable } from './CuerpoDocumentoTable'
import type { FormItem } from '../mappers'

function wrap(ui: ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}
const bien: FormItem = { descripcion: 'X', cantidad: 1, precioUni: 10, uniMedida: 39, tipoItem: 1, tipoImpuesto: 1, bodegaId: 1 }

describe('CuerpoDocumentoTable — bodega según descuentaStock', () => {
  it('muestra Bodega para BIEN cuando el DTE descuenta stock', () => {
    wrap(<CuerpoDocumentoTable items={[bien]} onChange={vi.fn()} sucursalId={1} descuentaStock={true} />)
    expect(screen.getByLabelText('Bodega')).toBeInTheDocument()
  })
  it('NO muestra Bodega cuando el DTE no descuenta stock (FSE)', () => {
    wrap(<CuerpoDocumentoTable items={[bien]} onChange={vi.fn()} sucursalId={1} descuentaStock={false} />)
    expect(screen.queryByLabelText('Bodega')).not.toBeInTheDocument()
  })
})
