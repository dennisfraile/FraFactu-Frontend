import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AccesoDenegado } from './AccesoDenegado'

describe('AccesoDenegado', () => {
  it('muestra el mensaje 403 y enlace al dashboard', () => {
    render(<MemoryRouter><AccesoDenegado /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
  })
})
