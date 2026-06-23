import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from './Combobox'

const items = [{ id: 1, n: 'Centro' }, { id: 2, n: 'Norte' }, { id: 3, n: 'Sur' }]

describe('Combobox', () => {
  it('filtra por texto y selecciona una opción', async () => {
    const onChange = vi.fn()
    render(<Combobox items={items} value={null} onChange={onChange} getLabel={(i) => i.n} placeholder="Sucursal" id="suc" />)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.type(screen.getByRole('combobox'), 'Nor')
    await userEvent.click(screen.getByText('Norte'))
    expect(onChange).toHaveBeenCalledWith(items[1])
  })
})
