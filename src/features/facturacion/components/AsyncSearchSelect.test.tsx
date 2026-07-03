import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('no deja timers activos al desmontar tras blur', () => {
    // El cierre del dropdown se difiere con un setTimeout en onBlur, aparte del
    // timer de debounce. Ese timer de blur no se limpiaba al desmontar y (en la
    // suite completa) disparaba setOpen tras destruirse el jsdom. Ver auditoría #1.
    vi.useFakeTimers()
    try {
      const { unmount } = render(
        <AsyncSearchSelect
          onSearch={vi.fn().mockResolvedValue([])}
          getLabel={(x: { id: number; nombre: string }) => x.nombre}
          onSelect={vi.fn()}
          placeholder="Buscar cliente"
        />,
      )
      const input = screen.getByPlaceholderText('Buscar cliente')
      fireEvent.blur(input) // programa el setTimeout de cierre
      expect(vi.getTimerCount()).toBe(1)
      unmount()
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
