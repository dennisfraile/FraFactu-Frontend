import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EstadoCobroBadge } from './EstadoCobroBadge'

describe('EstadoCobroBadge', () => {
  it('muestra el texto del estado', () => {
    render(<EstadoCobroBadge estado="Pagado" />)
    expect(screen.getByText('Pagado')).toBeInTheDocument()
  })
  it('no rompe con un estado desconocido', () => {
    render(<EstadoCobroBadge estado="Otro" />)
    expect(screen.getByText('Otro')).toBeInTheDocument()
  })
})
