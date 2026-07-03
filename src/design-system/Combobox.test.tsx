import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('no deja timers activos al desmontar tras blur', () => {
    // El cierre del dropdown se difiere con un setTimeout en onBlur. Si ese timer
    // no se limpia al desmontar, dispara setOpen sobre un componente muerto y
    // (en la suite completa) revienta el jsdom de otro test. Ver auditoría #1.
    vi.useFakeTimers()
    try {
      const { unmount } = render(
        <Combobox items={items} value={null} onChange={vi.fn()} getLabel={(i) => i.n} id="suc" />,
      )
      const input = screen.getByRole('combobox')
      fireEvent.focus(input)
      fireEvent.blur(input) // programa el setTimeout de cierre
      expect(vi.getTimerCount()).toBe(1)
      unmount()
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
