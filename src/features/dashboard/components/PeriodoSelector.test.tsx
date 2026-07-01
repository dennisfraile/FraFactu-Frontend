import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PeriodoSelector } from './PeriodoSelector'
import { rangoDePreset } from '../date-range'

describe('PeriodoSelector', () => {
  it('al elegir un preset emite el rango correspondiente', () => {
    const onChange = vi.fn()
    const inicial = { preset: '30d' as const, ...rangoDePreset('30d') }
    render(<PeriodoSelector value={inicial} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /^hoy$/i }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ preset: 'hoy' }))
  })
  it('modo personalizado emite preset custom al cambiar una fecha', () => {
    const onChange = vi.fn()
    const inicial = { preset: '30d' as const, ...rangoDePreset('30d') }
    render(<PeriodoSelector value={inicial} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /personalizado/i }))
    const desde = screen.getByLabelText(/desde/i)
    fireEvent.change(desde, { target: { value: '2026-01-01' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ preset: 'custom' }))
  })
})
