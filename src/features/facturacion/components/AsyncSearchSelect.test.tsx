import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AsyncSearchSelect } from './AsyncSearchSelect'

describe('AsyncSearchSelect', () => {
  it('busca tras escribir y selecciona un resultado', async () => {
    const onSearch = vi.fn().mockResolvedValue([{ id: 1, nombre: 'Cliente Uno' }])
    const onSelect = vi.fn()
    render(
      <AsyncSearchSelect
        onSearch={onSearch}
        getLabel={(x: { id: number; nombre: string }) => x.nombre}
        onSelect={onSelect}
        placeholder="Buscar cliente"
      />,
    )
    await userEvent.type(screen.getByPlaceholderText('Buscar cliente'), 'Cli')
    expect(await screen.findByText('Cliente Uno')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Cliente Uno'))
    expect(onSelect).toHaveBeenCalledWith({ id: 1, nombre: 'Cliente Uno' })
  })
})
