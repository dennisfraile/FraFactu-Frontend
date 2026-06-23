import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Table } from './Table'

const rows = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, nombre: `Item ${i + 1}` }))
const columns = [{ key: 'nombre', header: 'Nombre' }]

describe('Table', () => {
  it('pagina: muestra pageSize filas y avanza de página', async () => {
    render(<Table columns={columns} rows={rows} pageSize={5} getRowKey={(r) => r.id} />)
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.queryByText('Item 6')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByText('Item 6')).toBeInTheDocument()
  })
})

describe('Table — paginación de servidor', () => {
  const cols = [{ key: 'n', header: 'N' }]
  const rows = [{ n: 1 }, { n: 2 }]
  it('muestra la página/total recibidos y delega el cambio de página', async () => {
    const onPageChange = vi.fn()
    render(
      <Table
        columns={cols}
        rows={rows}
        getRowKey={(r) => r.n}
        serverPagination={{ page: 2, totalPages: 5, onPageChange }}
      />,
    )
    expect(screen.getByText('Página 2 de 5')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })
})
